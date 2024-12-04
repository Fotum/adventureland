class HealerBehaviour {
    #USE_HP_AT_RATIO = 0.75;
    #USE_MP_AT_RATIO = 0.9;

    // General settings
    #USE_HEAL_AT_RATIO = 0.85;
    #USE_MASS_HEAL_AT_RATIO = 0.6;
    #KEEP_MP = character.mp_cost * 15;

    // States
    #move_by_graph = false;

    // Skill flags
    #useSkillsFlag = false;
    #attackHealFlag = false;
    #targetChooseFlag = false;
    #moveFlag = false;

    constructor(solo, farm_location) {
        this.solo = solo;
        this.farm_area = farm_location.farm_area;
        this.farm_options = farm_location.farm_options[character.name];

        this.regenLoop();
        this.lootLoop();

        this.useSkillsLoop();
        this.targetChooseLoop();
        this.attackHealLoop();
        this.moveLoop();
    }

    // Enables all loops
    enable() {
        this.#attackHealFlag = true;
        this.#targetChooseFlag = true;
        this.#useSkillsFlag = true;
        this.#moveFlag = true;
    }

    // Disables all loops
    disable() {
        this.#attackHealFlag = false;
        this.#targetChooseFlag = false;
        this.#useSkillsFlag = false;
        this.#moveFlag = false;

        change_target(undefined);
    }
    
    // --------------------- GENERAL COMBAT SECTION --------------------- //
    async attackHealLoop() {
        if (!this.#attackHealFlag || character.rip) {
            setTimeout(this.attackHealLoop.bind(this), Math.max(1, ms_to_next_skill("attack")));
            return;
        }

        try {
            let target = get_target();
            if (target) {
                let isPlayer = (target.player || target.id === character.name) && target.type === "character";
                let shouldHeal = isPlayer && target.health_ratio <= this.#USE_HEAL_AT_RATIO;
                if (shouldHeal && can_attack(target)) {
                    await heal(target).catch(() => {});
                    reduce_cooldown("attack", Math.min(...parent.pings));
                } else if (!isPlayer && can_attack(target) && character.mp >= character.mp_cost) {
                    await attack(target).catch(() => {});
                    reduce_cooldown("attack", Math.min(...parent.pings));
                }
            }
        } catch (ex) {
            console.error("attackHealLoop", ex);
        }

        setTimeout(this.attackHealLoop.bind(this), Math.max(1, ms_to_next_skill("attack")));
    }

    async targetChooseLoop() {
        if (!this.#targetChooseFlag || smart.moving || character.rip) {
            setTimeout(this.targetChooseLoop.bind(this), 100);
            return;
        }

        try {
            if (!this.solo) {
                await this.targetChooseParty();
            } else {
                await this.targetChooseSolo();
            }
        } catch(ex) {
            console.error("targetChooseLoop", ex);
        }

        setTimeout(this.targetChooseLoop.bind(this), 100);
    }
    
    async targetChooseParty() {
        let tank_character = parent.entities["Shalfey"];

        let target = get_target();
        let entityTarget = target ? parent.entities[target.id] : null;
        let tanks_target = get_target_of(tank_character);
        let lowestHealth = this.lowest_health_partymember();
        let targetingMe = Object.values(parent.entities).find((e) => e.type === "monster" && e.target === character.name);

        if (lowestHealth.health_ratio < this.#USE_HEAL_AT_RATIO) {
            if (!target || (target && target.id !== lowestHealth.id)) await change_target(lowestHealth);
        } else if (targetingMe && (!target || (target.id !== targetingMe.id))) {
            await change_target(targetingMe);
        } else if (tanks_target && (!target || (target.id !== tanks_target.id))) {
            await change_target(tanks_target);
        } else if (!target) {
            await change_target(tank_character);
        } else if (target && !entityTarget) {
            await change_target(null);
        }
    }
    
    async targetChooseSolo() {
        // Check if we have some monster in target
        let target = get_targeted_monster();
        let entityTarget = target ? parent.entities[target.id] : null;
        // Check if we have some party member with low hp
        let lowestHealth = this.lowest_health_partymember();

        if (lowestHealth.health_ratio < this.#USE_HEAL_AT_RATIO) {
            if (!target || (target && target.id !== lowestHealth.id)) await change_target(lowestHealth);
        } else if (!target) {
            target = this.find_viable_targets()[0];
            if (target) await change_target(target);
        } else if (target && !entityTarget) {
            await change_target(null);
        }
    }

    async moveLoop() {
        try {
            if (!this.#moveFlag || smart.moving || character.rip) {
                setTimeout(this.moveLoop.bind(this), 200);
                return;
            }

            // Avoidance parameters
            let entityScale = 20;
            let rangeBuffer = 50;
            let characterMaxRange = character.range - 10;

            let target = get_target();
            let characterVector = new Vector(character.real_x, character.real_y);
            let avoidanceVector = getEntityAvoidanceVector(characterVector, rangeBuffer, characterMaxRange, entityScale);
            if (target && target.name !== character.name) {
                if (can_move_to(target.x, target.y)) {
                    this.#move_by_graph = false;
                    let targetVector = getTargetVector(target, target.range + 50, characterMaxRange);

                    let moveVector = targetVector.clone().add(avoidanceVector).limit(50);
                    let pathVector = characterVector.clone().add(moveVector);

                    let secondAvoidanceVector = getEntityAvoidanceVector(pathVector, rangeBuffer, characterMaxRange, entityScale);
                    if (Math.abs(avoidanceVector.toAngles() - secondAvoidanceVector.toAngles()) > 0.087266) moveVector.add(avoidanceVector).limit(50);

                    pathVector = characterVector.clone().add(moveVector);
                    if (distance2D(pathVector.x, pathVector.y) > 10) move(pathVector.x, pathVector.y);
                } else if (!this.#move_by_graph) {
                    this.#move_by_graph = true;
                    this.moveByGraph(target);
                }
            } else if (avoidanceVector.length() > 10) {
                let evadeMove = characterVector.add(avoidanceVector.limit(50));
                move(evadeMove.x, evadeMove.y);
            }
        } catch (ex) {
            this.#move_by_graph = false;
            console.error("moveLoop", ex);
        }

        setTimeout(this.moveLoop.bind(this), 200);
    }

    async moveByGraph(target) {
        if (this.#move_by_graph) {
            if (!target) {
                this.#move_by_graph = false;
                return;
            }

            let from = {x: character.real_x, y: character.real_y};
            let to = {x: target.x, y: target.y};
            let path = plotPath(from, to);

            for (let node of path) {
                if (this.#move_by_graph) {
                    await move(node.x, node.y);
                }
            }
            this.#move_by_graph = false;
        }
    }
    
    // ------------------------- SKILLS SECTION ------------------------- //
    async useSkillsLoop() {
        if (!this.#useSkillsFlag || character.rip) {
            setTimeout(this.useSkillsLoop.bind(this), 100);
            return;
        }

        try {
            await this.priestSkills();
        } catch (ex) {
            console.log("useSkillsLoop", ex);
        }

        setTimeout(this.useSkillsLoop.bind(this), 100);
    }

    priestSkills() {
        let allPromises = [];

        if (this.farm_options?.use_mass_heal) allPromises.push(this.partyHeal());

        if (!smart.moving) {
            if (this.farm_options?.use_curse) allPromises.push(this.curse());

            allPromises.push(this.darkBlessing());
        }

        return Promise.allSettled(allPromises);
    }

    curse() {
        const target = get_targeted_monster();
        if (target && !target.immune) {
            if (!is_on_cooldown("curse") && is_in_range(target, "curse") && !is_disabled(character) && !target.s?.cursed && character.mp > this.#KEEP_MP) {
                return use_skill("curse", target)
                    .then(reduce_cooldown("curse", Math.min(...parent.pings)));
            }
        }
    }

    darkBlessing() {
        let target = get_targeted_monster();
        if (target && !is_on_cooldown("darkblessing") && !is_disabled(character) && character.mp > this.#KEEP_MP) {
            return use_skill("darkblessing")
                .then(reduce_cooldown("darkblessing", Math.min(...parent.pings)));
        }
    }

    partyHeal() {
        const lowest_health = this.lowest_health_partymember();
        const lowest_my_character = MY_CHARACTERS
            .filter((nm) => nm !== character.name && parent.party_list.includes(nm))
            .map((nm) => {
                let my_char = get(nm);
                let health_ratio = my_char.hp / my_char.max_hp;

                return {name: nm, health_ratio: health_ratio, rip: my_char.rip};
            }).sort(function (current, next) {
                return current.health_ratio - next.health_ratio;
            })[0];

        let useMassHeal = (lowest_health && !lowest_health.rip && lowest_health.health_ratio < this.#USE_MASS_HEAL_AT_RATIO) ||
                        (lowest_my_character && !lowest_my_character.rip && lowest_my_character.health_ratio < this.#USE_MASS_HEAL_AT_RATIO);

        if (!is_on_cooldown("partyheal") && useMassHeal && character.mp > this.#KEEP_MP) {
            return use_skill("partyheal")
                .then(reduce_cooldown("partyheal", Math.min(...parent.pings)));
        }
    }

    // ------------------------- UTILITY SECTION ------------------------ //
    async regenLoop() {
        try {
            // Don't heal if we're dead or using teleport to town
            if (!can_use("regen_hp") || character.rip || smart.curr_step?.town) {
                setTimeout(this.regenLoop.bind(this), Math.max(100, ms_to_next_skill("use_hp")));
                return;
            }
    
            const hpRatio = character.hp / character.max_hp;
            const mpRatio = character.mp / character.max_mp;
            const minPing = Math.min(...parent.pings);
            
            if (mpRatio < hpRatio && mpRatio < this.#USE_MP_AT_RATIO) {
                // Let's regen mp
                let mpPot0 = locate_item("mpot0");
                let mpPot1 = locate_item("mpot1");
    
                if (mpPot1 !== -1) {
                    await equip(mpPot1);
                    reduce_cooldown("use_mp", minPing);
                } else if (mpPot0 !== -1) {
                    await equip(mpPot0);
                    reduce_cooldown("use_mp", minPing);
                } else {
                    await use_skill("regen_mp");
                    reduce_cooldown("regen_mp", minPing);
                }
            } else if (hpRatio < this.#USE_HP_AT_RATIO) {
                // Let's regen hp
                let hpPot0 = locate_item("hpot0");
                let hpPot1 = locate_item("hpot1");
    
                if (hpPot1 !== -1) {
                    await equip(hpPot1);
                    reduce_cooldown("use_hp", minPing);
                } else if (hpPot0 !== -1) {
                    await equip(hpPot0);
                    reduce_cooldown("use_hp", minPing);
                } else {
                    await use_skill("regen_hp");
                    reduce_cooldown("regen_hp", minPing);
                }
            }
        } catch (ex) {
            console.error("regenLoop", ex);
        }
    
        setTimeout(this.regenLoop.bind(this), Math.max(100, ms_to_next_skill("use_hp")));
    }

    async lootLoop() {
        try {
            let looterNm = this.farm_options.looter;
            if (this.solo || !looterNm || looterNm === character.name || !parent.party_list.includes(looterNm) || get(looterNm).map !== character.map) {
                loot();
            }
        } catch (ex) {
            console.error("lootLoop", ex);
        }
        
        setTimeout(this.lootLoop.bind(this), 250);
    }

    lowest_health_partymember() {
        let self = character;
        self.health_ratio = self.hp / self.max_hp;

        let party_names = [...parent.party_list];
        for (let char_nm of MY_CHARACTERS) {
            if (char_nm !== character.name && !party_names.includes(char_nm)) party_names.push(char_nm);
        }

        let party = [self];
        for (let member_name of party_names) {
            if (member_name === character.name) continue;

            let entity = parent.entities[member_name];
            if (entity && !entity.rip) {
                entity.health_ratio = entity.hp / entity.max_hp;
                party.push(entity)
            }
        }
    
        //Order our party array by health percentage
        party.sort(function (current, next) {
            return current.health_ratio - next.health_ratio;
        });
    
        //Return the lowest health
        return party[0];
    }
    
    find_viable_targets() {
        let monsters = Object.values(parent.entities).filter((e) => e.type === "monster");
        monsters.forEach((e) => {
                e.targeting_party = e.target !== character.name && parent.party_list.includes(e.target);
                e.is_boss_target = FARM_BOSSES.includes(e.mtype);
            });

        if (this.farm_area) {
            let farmable = this.farm_area.farm_monsters;
            let blacklist = this.farm_area.blacklist_monsters;

            // Area filter
            let area = this.farm_area.area;
            if (area) monsters = monsters.filter((mob) => (!this.solo && mob.targeting_party) || mob.is_boss_target || parent.simple_distance(area, mob) <= area.d);

            // Whitelist/Blacklist filter
            monsters = monsters.filter((mob) => mob.targeting_party || mob.is_boss_target || (farmable.includes(mob.mtype) && !blacklist.includes(mob.mtype)));
        }
    
        if (monsters.length > 0) {
            monsters.sort(
                function (current, next) {
                    // If mob targeting our party member - prioritize it
                    if (current.targeting_party !== next.targeting_party) {
                        return (current.targeting_party && !next.targeting_party) ? -1 : 1;
                    }
    
                    let dist_current = parent.simple_distance(character, current);
                    let dist_next = parent.simple_distance(character, next);
                    // If mob is boss - prioritize it and sort em by distance (if more than one)
                    if (current.is_boss_target !== next.is_boss_target) {
                        return (current.is_boss_target && !next.is_boss_target) ? -1 : 1;
                    } else if (current.is_boss_target && next.is_boss_target) {
                        return (dist_current < dist_next) ? -1 : 1;
                    }
    
                    // If mob is not boss - sort em by distance
                    if (dist_current !== dist_next) {
                        return (dist_current < dist_next) ? -1 : 1;
                    }
                    
                    return 0;
                }
            );
        }
    
        return monsters;
    }
}