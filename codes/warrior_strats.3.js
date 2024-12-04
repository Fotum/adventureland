class WarriorBehaviour {
    #USE_HP_AT_RATIO = 0.75;
    #USE_MP_AT_RATIO = 0.6;

    // General settings
    #USE_HS_AT_HP_RATIO = 0.5;
    #KEEP_MP = character.mp_cost * 5;

    // Weapon sets
    #bossFarmSet = {main: {name: "fireblade", level: 9}, off: {name: "fireblade", level: 9}};
    #aoeFarmSet = {main: {name: "ololipop", level: 9}, off: {name: "ololipop", level: 9}};

    // Skill items
    #cleaveItem = {name: "bataxe", level: 8};
    #stompItem = {name: "basher", level: 7};

    // States
    #move_by_graph = false;

    #last_cleave = new Date();
    #last_stomp = new Date();
    #last_equip = new Date();

    // Skill flags
    #useSkillsFlag = false;
    #attackFlag = false;
    #targetChooseFlag = false;
    #moveFlag = false;

    constructor(solo, farm_location) {
        this.solo = solo;
        this.farm_area = farm_location.farm_area;
        this.farm_options = farm_location.farm_options[character.name];

        this.lootLoop();
        this.regenLoop();

        this.useSkillsLoop();
        this.targetChooseLoop();
        this.attackLoop();
        this.moveLoop();
    }

    // Enables all loops
    enable() {
        this.#useSkillsFlag = true;
        this.#attackFlag = true;
        this.#targetChooseFlag = true;
        this.#moveFlag = true;
    }

    // Disables all loops
    disable() {
        this.#useSkillsFlag = false;
        this.#attackFlag = false;
        this.#targetChooseFlag = false;
        this.#moveFlag = false;

        change_target(undefined);
    }

    // --------------------- GENERAL COMBAT SECTION --------------------- //
    async attackLoop() {
        if (!this.#attackFlag || smart.moving || character.rip) {
            setTimeout(this.attackLoop.bind(this), Math.max(1, ms_to_next_skill("attack")));
            return;
        }

        try {
            let target = get_targeted_monster();
            if (target && is_monster(target) && can_attack(target) && target.hp > 0 && character.mp >= character.mp_cost && !target.s.fullguardx) {
                await attack(target).catch(() => {});
                reduce_cooldown("attack", Math.min(...parent.pings));
            }
        } catch (ex) {
            console.error("attackLoop", ex);
        }

        setTimeout(this.attackLoop.bind(this), Math.max(1, ms_to_next_skill("attack")));
    }

    async targetChooseLoop() {
        if (!this.#targetChooseFlag || smart.moving || character.rip) {
            setTimeout(this.targetChooseLoop.bind(this), 100);
            return;
        }

        try {
            // Check if we have some monster in target
            let target = get_targeted_monster();
            let entityTarget = target ? parent.entities[target.id] : null;

            // If not, find viable monster to attack and select target
            if (!target) {
                let healerEntity = parent.entities[this.farm_options.healer];
                let healerNearby = this.solo || !this.farm_options.healer || (healerEntity && healerEntity.map === character.map && parent.simple_distance(character, healerEntity) <= 300);

                if (healerNearby) {
                    target = this.find_viable_targets()[0];
                    if (target) await change_target(target);
                } else {
                    let targetingMe = Object.values(parent.entities).find((e) => e.type === "monster" && e.target === character.name);
                    if (targetingMe) await change_target(targetingMe);
                }
            } else if (target && !entityTarget) {
                await change_target(null);
            }
        } catch (ex) {
            console.error("targetChooseLoop", ex);
        }

        setTimeout(this.targetChooseLoop.bind(this), 100);
    }

    async moveLoop() {
        try {
            if (!this.#moveFlag || smart.moving || character.rip) {
                setTimeout(this.moveLoop.bind(this), 200);
                return;
            }

            let target = get_targeted_monster();
            if (target && target.name !== character.name) {
                let isInRange = is_in_range(target, "attack");
                let kitingRange = character.range - 5;

                let targetPositionVector = new Vector(target.real_x, target.real_y);
                let charTrgDiffVector = new Vector(character.real_x - target.real_x, character.real_y - target.real_y).normalize().multiply(kitingRange);
                // If in range - run around and attack
                if (isInRange) {
                    this.#move_by_graph = false;

                    let newPositionVec = targetPositionVector.clone();
                    if (this.farm_options.do_circle) {
                        let rndAngle = get_random_angle();
                        let rotatedVector = charTrgDiffVector.clone().rotate(rndAngle);
                        newPositionVec.add(rotatedVector);

                        while (!can_move_to(newPositionVec.x, newPositionVec.y)) {
                            rndAngle = get_random_angle();
                            rotatedVector.rotate(rndAngle);
                            newPositionVec = targetPositionVector.clone().add(rotatedVector);
                        }
                    } else {
                        newPositionVec.add(charTrgDiffVector);
                    }

                    if (distance2D(newPositionVec.x, newPositionVec.y) > 15) await move(newPositionVec.x, newPositionVec.y);

                // If moving by graph and can already use our normal movement
                } else if (this.#move_by_graph && can_move_to(targetPositionVector.x, targetPositionVector.y)) {
                    this.#move_by_graph = false;

                    let newPositionVec = targetPositionVector.clone().add(charTrgDiffVector);
                    move(newPositionVec.x, newPositionVec.y);

                // Cannot reach target so move by graph
                } else if (!this.#move_by_graph) {
                    this.#move_by_graph = true;
                    this.moveByGraph(target);
                }
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
        if (!this.#useSkillsFlag || smart.moving || character.rip) {
            setTimeout(this.useSkillsLoop.bind(this), 100);
            return;
        }

        try {
            await this.warriorSkills();
        } catch (ex) {
            console.error("useSkillsLoop", ex);
        }

        setTimeout(this.useSkillsLoop.bind(this), 100);
    }

    warriorSkills() {
        let healerEntity = parent.entities[this.farm_options.healer];
        let healerNearby = this.solo || !this.farm_options.healer || (healerEntity && healerEntity.map === character.map && parent.simple_distance(character, healerEntity) <= 300);
        
        let allPromises = [];

        if (this.farm_options?.use_taunt) allPromises.push(this.taunt());
        if (this.farm_options?.use_agitate && healerNearby) allPromises.push(this.massTaunt());
        if (this.farm_options?.use_cleave && this.#cleaveItem && healerNearby) allPromises.push(this.cleave());
        if (this.#stompItem) allPromises.push(this.stomp());

        allPromises.push(this.ensureEquipped());
        allPromises.push(this.hardShell());
        allPromises.push(this.warCry());

        return Promise.allSettled(allPromises);
    }
    
    taunt() {
        let target = this.find_viable_targets().find((mob) => mob.targeting_party);
        if (target && !is_on_cooldown("taunt")
            && is_in_range(target, "taunt")
            && !is_disabled(character)
            && character.mp > (G.skills.taunt.mp + this.#KEEP_MP))
        {
            return use_skill("taunt", target)
                .then(reduce_cooldown("taunt", Math.min(...parent.pings)));
        }
    }
    
    hardShell() {
        let hpRatio = character.hp / character.max_hp;
        if (!is_on_cooldown("hardshell")
             && hpRatio < this.#USE_HS_AT_HP_RATIO
             && !character.moving
             && !is_disabled(character)
             && G.skills["hardshell"].mp <= character.mp)
        {
            return use_skill("hardshell", character)
                .then(reduce_cooldown("hardshell", Math.min(...parent.pings)));
        }
    }
    
    warCry() {
        if (get_targeted_monster()
            && !is_on_cooldown("warcry")
            && !is_disabled(character)
            && character.mp > (G.skills.warcry.mp + this.#KEEP_MP))
        {
            return use_skill("warcry")
                .then(reduce_cooldown("warcry", Math.min(...parent.pings)));
        }
    }

    massTaunt() {
        if (!is_on_cooldown("agitate")
            && !is_disabled(character)
            && character.mp > (G.skills.agitate.mp + this.#KEEP_MP))
        {
            const monstersInRange = this.find_viable_targets().filter((mob) => is_in_range(mob, "agitate"));
            let shouldCast = monstersInRange.length >= 3
                    && monstersInRange.every((m) => m?.attack <= 800 /*&& m?.level <= 10*/)
                    && monstersInRange.filter((m) => m?.target !== character.name).length >= 4;
            
            if (shouldCast) {
                return use_skill("agitate")
                    .then(reduce_cooldown("agitate", Math.min(...parent.pings)));
            }
        }
    }

    cleave() {
        const cleaveItem = this.#cleaveItem;
        if (cleaveItem && !is_on_cooldown("cleave") && mssince(this.#last_stomp) > 300 && !is_disabled(character) && character.mp > (G.skills.cleave.mp + this.#KEEP_MP)) {
            let monstersToCleave = this.find_viable_targets().filter((mob) => is_in_range(mob, "cleave"));
            if (monstersToCleave.length >= 3) {

                let currMainhand = character.slots.mainhand;
                let currOffhand = character.slots.offhand;

                let shouldChangeMain = currMainhand.name !== cleaveItem.name || currMainhand.level !== cleaveItem.level;
                let shouldUnequipOffhand = !!currOffhand;

                this.#last_cleave = new Date();
                let task = async function(shouldChangeMain, shouldUnequipOffhand) {
                    if (shouldChangeMain) {
                        if (shouldUnequipOffhand) await unequip("offhand");

                        let cleaveItemIndex = find_desired_item(cleaveItem);
                        if (cleaveItemIndex > -1) await equip(cleaveItemIndex);
                    }

                    await use_skill("cleave").then(reduce_cooldown("cleave", Math.min(...parent.pings)));
                };

                return task(shouldChangeMain, shouldUnequipOffhand);
            }
        } 
    }

    stomp() {
        const stompItem = this.#stompItem;
        if (stompItem && !is_on_cooldown("stomp") && !is_disabled(character) && character.mp > (G.skills.stomp.mp + this.#KEEP_MP)) {
            let targetingMe = Object.values(parent.entities).filter((e) => e.type === "monster" && e.target === character.name && distance2D(e.real_x, e.real_y) <= 50);
            if (targetingMe.length >= 4) {
                let currMainhand = character.slots.mainhand;
                let currOffhand = character.slots.offhand;

                let shouldChangeMain = currMainhand.name !== stompItem.name || currMainhand.level !== stompItem.level;
                let shouldUnequipOffhand = !!currOffhand;

                this.#last_stomp = new Date();
                let task = async function(shouldChangeMain, shouldUnequipOffhand) {
                    if (shouldChangeMain) {
                        if (shouldUnequipOffhand) await unequip("offhand");

                        let stompItemIndex = find_desired_item(stompItem);
                        if (stompItemIndex > -1) await equip(stompItemIndex);
                    }

                    await use_skill("stomp").then(reduce_cooldown("stomp", Math.min(...parent.pings)));
                };

                return task(shouldChangeMain, shouldUnequipOffhand);
            }
        }
    }

    ensureEquipped() {
        let currMainhand = character.slots.mainhand;
        let currOffHand = character.slots.offhand;
        let desiredSet = this.farm_options.use_explosion ? this.#aoeFarmSet : this.#bossFarmSet;

        let canEquip = mssince(this.#last_cleave) > 300 && mssince(this.#last_equip) > 300 && mssince(this.#last_stomp) > 300;
        let wrongMainhand = (currMainhand?.name !== desiredSet.main.name || currMainhand?.level !== desiredSet.main.level);
        let wrongOffhand = (currOffHand?.name !== desiredSet.off.name || currOffHand?.level !== desiredSet.off.level);

        if (canEquip && (wrongMainhand || wrongOffhand)) {
            let desiredMainhandIx = -1;
            if (wrongMainhand) desiredMainhandIx = find_desired_item(desiredSet.main);

            let desiredOffhandIx = -1;
            if (wrongOffhand) {
                let tmpStart = 0;
                if (desiredSet.off.name === desiredSet.main.name && desiredSet.off.level === desiredSet.main.level)
                    tmpStart = desiredMainhandIx + 1;

                desiredOffhandIx = find_desired_item(desiredSet.off, tmpStart);
            }

            let equipArray = [];
            if (desiredMainhandIx > -1) equipArray.push({num: desiredMainhandIx, slot: "mainhand"});
            if (desiredOffhandIx > -1) equipArray.push({num: desiredOffhandIx, slot: "offhand"});

            if (equipArray.length > 0) {
                this.#last_equip = new Date();
                return equip_batch(equipArray);
            }
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
            
            if ((hpRatio < mpRatio && hpRatio <= this.#USE_HP_AT_RATIO) || (hpRatio <= 0.55 && mpRatio >= character.mp_cost)) {
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
            } else if (mpRatio <= this.#USE_MP_AT_RATIO) {
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

    find_viable_targets() {
        let monsters = Object.values(parent.entities).filter((e) => e.type === "monster");
        monsters.forEach((e) => {
                e.targeting_party = e.target !== character.name && parent.party_list.includes(e.target);
                e.is_boss_target = FARM_BOSSES.includes(e.mtype);
            });

        if (this.farm_area) {
            let farmable = this.farm_area.farm_monsters || [];
            let blacklist = this.farm_area.blacklist_monsters || [];

            // Area filter
            let area = this.farm_area.area;
            if (area) monsters = monsters.filter((mob) => (!this.solo && mob.targeting_party) || mob.is_boss_target || parent.simple_distance(area, mob) <= area.d);

            // Whitelist/Blacklist filter
            monsters = monsters.filter(
                (mob) => (!this.solo && mob.targeting_party)
                        || mob.target === character.name
                        || mob.is_boss_target
                        || (farmable.includes(mob.mtype) && !blacklist.includes(mob.mtype))
            );
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
    
        return monsters.filter((m) => m.mtype !== "wabbit");
    }
}