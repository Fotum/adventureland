class MageController extends CharacterController {
    async callPartyForEvent() {
        let myState = character.state;
        let targets = myState.farm_area.farm_monsters;

        let targetsAround = await waitForTargets(targets, 5);
        if (targetsAround.length === 0) return;

        let bossInfo = BOSS_INFO[myState.event_options.type][myState.event_options.name];
        let eventCharacters = Object.keys(bossInfo.characters);
        if (eventCharacters.length > 2) {
            let onServer = getOnlineCharacters();
            let summonNames = eventCharacters.filter((c) => c !== character.name && onServer.includes(c));
            let toSummon = [];
            for (let summonNm of summonNames) {
                let summonEntity = parent.entities[summonNm];
                if (!summonEntity || parent.simple_distance(character, summonEntity) >= 300) toSummon.push(summonNm);
            }

            let notifyEvent = {
                id: myState.event_options.id,
                name: myState.event_options.name,
                type: myState.event_options.type,
                wait_resp: myState.event_options.wait_resp,
                summon: true,
                destination: myState.farm_area.position
            };
            await this.strategy.massMagiport(toSummon, true);
            send_cm(summonNames, notifyEvent);
        }
    }

    async callPartyBackToSpot() {
        let myFarmSpot = this.strategy.farm_area.name;
        if (!myFarmSpot) return;

        let myParty = parent.party_list
                .map((nm) => get(nm))
                .filter((m) => m && ![character.name, "Momental"].includes(m.name));

        let summonList = [];
        for (let partyMember of myParty) {
            let memberIsSolo = partyMember.state?.solo;
            let memberFarmArea = partyMember.state?.farm_area?.name;

            let canSummon = !memberIsSolo
                         && partyMember?.state?.name !== "event"
                         && (memberFarmArea && memberFarmArea === myFarmSpot)
                         && (partyMember.map !== character.map || distance(character, partyMember) >= 600);

            if (canSummon) summonList.push(partyMember.name);
        }

        await this.strategy.massMagiport(summonList, true);
    }
}


class MageBehaviour {
    // General settings
    #USE_HP_AT_RATIO = 0.75;
    #USE_MP_AT_RATIO = 0.9;

    #USE_BURST_AT_MP_RATIO = 0.8;
    #KEEP_MP = character.mp_cost * 6;

    // Weapons for swap
    #mainWeapon = {name: "firestaff", level: 9};
    #alterWeapon = {name: "pinkie", level: 8};

    // States
    #move_by_graph = false;

    // Skill flags
    #useSkilsFlag = false;
    #attackFlag = false;
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
        this.attackLoop();
        this.moveLoop();
    }

    // Enables all loops
    enable() {
        this.#useSkilsFlag = true;
        this.#attackFlag = true;
        this.#targetChooseFlag = true;
        this.#moveFlag = true;
    }

    // Disables all loops
    disable() {
        this.#useSkilsFlag = false;
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
            if (target && can_attack(target) && character.mp >= character.mp_cost) {
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
        let target = get_targeted_monster();
        let entityTarget = target ? parent.entities[target.id] : null;
        let tanks_target = get_target_of(tank_character);
        let targetingMe = Object.values(parent.entities).find((e) => e.type === "monster" && e.target === character.name);

        if (targetingMe && (!target || (targetingMe.id !== target.id))) {
            await change_target(targetingMe);
        } else if (tanks_target && (!target || (tanks_target.id !== target.id))) {
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

        // If not, find viable monster to attack and select target
        if (!target) {
            target = this.find_viable_targets()[0];
            if (target) await change_target(target);
        } else if (target && !entityTarget) {
            await change_target(null);
        }
    }

    // async moveLoop() {
    //     try {
    //         if (!this.#moveFlag || smart.moving || character.rip) {
    //             setTimeout(this.moveLoop.bind(this), 200);
    //             return;
    //         }

    //         // Avoidance parameters
    //         let entityScale = 20;
    //         let rangeBuffer = 50;
    //         let characterMaxRange = character.range - 10;

    //         let target = get_target();
    //         let characterVector = new Vector(character.real_x, character.real_y);
    //         let avoidanceVector = getEntityAvoidanceVector(characterVector, rangeBuffer, characterMaxRange, entityScale);
    //         if (target && target.name !== character.name) {
    //             let targetVector = getTargetVector(target, target.range + 50, characterMaxRange);
    //             let moveVector = targetVector.clone().add(avoidanceVector).limit(50);
    //             let pathVector = characterVector.clone().add(moveVector);

    //             let secondAvoidanceVector = getEntityAvoidanceVector(pathVector, rangeBuffer, characterMaxRange, entityScale);
    //             if (Math.abs(avoidanceVector.toAngles() - secondAvoidanceVector.toAngles()) > 0.087266) moveVector.add(avoidanceVector).limit(50);

    //             pathVector = characterVector.clone().add(moveVector);

    //             let canMoveTo = can_move_to(pathVector.x, pathVector.y);
    //             if (distance2D(pathVector.x, pathVector.y) > 10 && canMoveTo) {
    //                 this.#move_by_graph = false;
    //                 move(pathVector.x, pathVector.y);
    //             } else if (!this.#move_by_graph && !canMoveTo) {
    //                 this.#move_by_graph = true;
    //                 this.moveByGraph(characterVector.add(targetVector));
    //             }
    //         } else if (avoidanceVector.length() > 10) {
    //             let evadeMove = characterVector.add(avoidanceVector.limit(50));
    //             move(evadeMove.x, evadeMove.y);
    //         }
    //     } catch (ex) {
    //         this.#move_by_graph = false;
    //         console.error("moveLoop", ex);
    //     }

    //     setTimeout(this.moveLoop.bind(this), 200);
    // }

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
        if (!this.#useSkilsFlag || smart.moving || character.rip) {
            setTimeout(this.useSkillsLoop.bind(this), 100);
            return;
        }

        try {
            await this.mageSkills();
        } catch (ex) {
            console.error("useSkillsLoop", ex);
        }

        setTimeout(this.useSkillsLoop.bind(this), 100);
    }

    mageSkills() {
        let allPromises = [];

        if (this.farm_options?.use_burst) allPromises.push(this.manaBurst());
        if (this.farm_options?.energize) allPromises.push(this.energize("Shalfey"));

        allPromises.push(this.ensureEquipped());

        return Promise.allSettled(allPromises);
    }

    manaBurst() {
        let mpRatio = character.mp / character.max_mp;
        if (mpRatio <= this.#USE_BURST_AT_MP_RATIO || is_on_cooldown("cburst")) return;

        const manaToSpend = character.mp - this.#KEEP_MP;

        let targets = this.find_viable_targets();
        if (!this.solo) targets = targets.filter((mob) => mob.target === "Shalfey");

        if (targets.length > 0) {
            if (targets.length > 1) {
                targets = targets
                    .filter((trg) => is_in_range(trg, "cburst") && !trg.immune)
                    .map((trg) => {
                        let manaToKill = trg.hp / G.skills.cburst.ratio + 100;
                        return {id: trg.id, manaToKill: manaToKill};
                    })
                    .sort(function (current, next) {
                        if (current.manaToKill !== next.manaToKill) return (current.manaToKill < next.manaToKill) ? -1 : 1;

                        return 0;
                    });
            }

            let currTarget = get_targeted_monster();
            let tmpManaToSpend = manaToSpend;
            let burstList = [];
            for (let trg of targets) {
                if (trg.manaToKill <= tmpManaToSpend) {
                    if (trg.id === currTarget) currTarget = undefined;

                    burstList.push([trg.id, trg.manaToKill]);
                    tmpManaToSpend -= trg.manaToKill;
                } else if (currTarget) {
                    if (!currTarget.immune) burstList.push([currTarget.id, tmpManaToSpend]);
                    break;
                }
                else {
                    break;
                }
            }

            if (burstList.length > 0) {
                return use_skill("cburst", burstList)
                    .then(reduce_cooldown("cburst", Math.min(...parent.pings)));
            } 
        }
    }

    energize(targetNm) {
        let target = parent.entities[targetNm];
        if (!target) target = character;

        if (target && !is_on_cooldown("energize") && is_in_range(target, "energize") && !is_disabled(character)) {
            // use_skill("energize",target,optional_mp)
            return use_skill("energize", target, 1)
                .then(reduce_cooldown("energize", Math.min(...parent.pings)));
        }
    }

    magiport(targetNm) {
        if (character.mp >= (G.skills.magiport.mp + this.#KEEP_MP)) {
            return use_skill("magiport", targetNm);
        }
    }

    massMagiport(toSummon, shouldWait) {
        if (!toSummon || toSummon.length === 0) return;
        let mpNeeded = toSummon.length * G.skills.magiport.mp + this.#KEEP_MP;

        let task = async function(toSummon, mpNeeded, shouldWait) {
            while (character.mp < mpNeeded && shouldWait) {
                await sleep(500);
            }

            for (let trg of toSummon) {
                await use_skill("magiport", trg);
            }
        };

        return task(toSummon, mpNeeded, shouldWait);
    }

    ensureEquipped() {
        let currMainhand = character.slots.mainhand;
        // let desiredMainhand = this.farm_options?.alter_weapon ? this.#alterWeapon : this.#mainWeapon;
        let desiredMainhand = this.#mainWeapon;

        let target = get_targeted_monster();
        if (target && target.max_hp <= 1500)
            desiredMainhand = this.#alterWeapon;

        let wrongMainhand = target && (currMainhand?.name !== desiredMainhand.name || currMainhand?.level !== desiredMainhand.level);
        if (wrongMainhand) {
            let desiredMainhandIx = find_desired_item(desiredMainhand);
            if (desiredMainhandIx > -1) return equip(desiredMainhandIx);
        }
    }
    
    // ------------------------- UTILITY SECTION ------------------------ //
    // async regenLoop() {
    //     if (!can_use("regen_hp") || character.rip || smart.curr_step?.town) {
    //         setTimeout(this.regenLoop.bind(this), Math.max(100, ms_to_next_skill("use_hp")));
    //         return;
    //     }

    //     try {

    //     } catch (ex) {
    //         console.error(ex);
    //     }

    //     setTimeout(this.regenLoop.bind(this), Math.max(100, ms_to_next_skill("use_hp")));
    // }

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