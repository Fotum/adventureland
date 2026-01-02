import { CharacterType, Mage, Merchant, PingCompensatedCharacter, Priest, Warrior } from "alclient";
import { Strategy, CharacterRunner } from "../strategies/character_runner";
import { WarriorAttackStrategy } from "../strategies/warrior/warrior_attack_strategy";
import { BaseMoveStrategy } from "../strategies/move_strategy";
import { MAGE_AOE, MAGE_DPS, MAGE_FAST, PRIEST_GF, PRIEST_MF, PRIEST_TANKY, WARRIOR_AOE, WARRIOR_DPS } from "./equipment_setups";
import { MageAttackStrategy } from "../strategies/mage/mage_attack_strategy";
import { PriestAttackStrategy } from "../strategies/priest/priest_attack_strategy";


export type EventName = "goobrawl" | "dragold" | "icegolem" | "valentines" | "snowman";
export type SpecialName = "phoenix" | "frog" | "fvampire" | "mvampire" | "jr" | "greenjr" | "skeletor";

export type EventConfig = {
    waitResp?: boolean
    summon: boolean
    configs: {
        [T in CharacterType]?: {
            attack?: Strategy<PingCompensatedCharacter>,
            move?: Strategy<PingCompensatedCharacter>
        }
    }
    isActive: boolean
}


export function getEventConfig(eventName: SpecialName | EventName, executors: CharacterRunner<PingCompensatedCharacter>[]): EventConfig {
    let defaultEnergize = {
        onMpRatio: 0.8,
        when: { 
            mpRatio: 0.1
        }
    };

    switch (eventName) {
        // Events
        case "goobrawl":
            return {
                waitResp: true,
                summon: false,
                configs: {
                    warrior: {
                        attack: new WarriorAttackStrategy(executors, {
                            typeList: ["pinkgoo", "bgoo", "rgoo"],
                            disableIdleAttack: true,
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            ensureEquipped: WARRIOR_AOE,
                            disableStomp: true,
                            enableEquipForCleave: true
                        }),
                        move: new BaseMoveStrategy(["pinkgoo", "bgoo", "rgoo"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(executors, {
                            typeList: ["pinkgoo", "bgoo", "rgoo"],
                            disableIdleAttack: true,
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            ensureEquipped: MAGE_AOE,
                            disableScare: true,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["pinkgoo", "bgoo", "rgoo"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(executors, {
                            typeList: ["pinkgoo", "bgoo", "rgoo"],
                            disableIdleAttack: true,
                            enableGreedyAggro: true,
                            maximumTargets: 15,
                            enableAbsorbToTank: true,
                            ensureEquipped: PRIEST_GF,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["pinkgoo", "bgoo", "rgoo"])
                    }
                },
                isActive: true
            };
        case "dragold":
            return {
                summon: true,
                configs: {
                    warrior: {
                        attack: new WarriorAttackStrategy(executors, {
                            type: "dragold",
                            disableIdleAttack: true,
                            ensureEquipped: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            disableStomp: true
                        }),
                        move: new BaseMoveStrategy(["dragold"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(executors, {
                            type: "dragold",
                            disableIdleAttack: true,
                            ensureEquipped: MAGE_DPS,
                            disableCburst: true,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["dragold"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(executors, {
                            type: "dragold",
                            disableIdleAttack: true,
                            enableAbsorbToTank: true,
                            maximumTargets: 3,
                            ensureEquipped: PRIEST_TANKY,
                            enableHealStrangers: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["dragold"])
                    }
                },
                isActive: true
            };
        case "icegolem":
            return {
                summon: false,
                configs: {
                    warrior: {
                        attack: new WarriorAttackStrategy(executors, {
                            type: "icegolem",
                            disableIdleAttack: true,
                            ensureEquipped: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            disableStomp: true
                        }),
                        move: new BaseMoveStrategy(["icegolem"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(executors, {
                            type: "icegolem",
                            disableIdleAttack: true,
                            ensureEquipped: MAGE_DPS,
                            disableKillSteal: true,
                            disableCburst: true,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["icegolem"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(executors, {
                            type: "icegolem",
                            disableIdleAttack: true,
                            enableAbsorbToTank: true,
                            maximumTargets: 3,
                            ensureEquipped: PRIEST_TANKY,
                            enableHealStrangers: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["icegolem"])
                    }
                },
                isActive: true
            };
        case "valentines":
            return {
                summon: true,
                configs: {
                    warrior: {
                        attack: new WarriorAttackStrategy(executors, {
                            type: "pinkgoo",
                            disableIdleAttack: true,
                            ensureEquipped: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            disableStomp: true
                        }),
                        move: new BaseMoveStrategy(["pinkgoo"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(executors, {
                            type: "pinkgoo",
                            disableIdleAttack: true,
                            ensureEquipped: MAGE_FAST,
                            disableKillSteal: true,
                            disableCburst: true,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["pinkgoo"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(executors, {
                            type: "pinkgoo",
                            disableIdleAttack: true,
                            ensureEquipped: PRIEST_MF,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["pinkgoo"])
                    }
                },
                isActive: true
            };
        case "snowman":
            return {
                summon: true,
                configs: {
                    warrior: {
                        attack: new WarriorAttackStrategy(executors, {
                            type: "snowman",
                            ensureEquipped: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            disableStomp: true
                        }),
                        move: new BaseMoveStrategy(["snowman"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(executors, {
                            type: "snowman",
                            ensureEquipped: MAGE_FAST,
                            disableKillSteal: true,
                            disableCburst: true,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["snowman"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(executors, {
                            type: "snowman",
                            ensureEquipped: PRIEST_MF,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["snowman"])
                    }
                },
                isActive: true
            };

        // Special monsters
        case "phoenix":
            return {
                summon: true,
                configs: {
                    warrior: {
                        attack: new WarriorAttackStrategy(executors, {
                            type: "phoenix",
                            ensureEquipped: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["phoenix"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(executors, {
                            type: "phoenix",
                            ensureEquipped: MAGE_DPS,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["phoenix"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(executors, {
                            type: "phoenix",
                            ensureEquipped: PRIEST_MF,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["phoenix"])
                    }
                },
                isActive: true
            };
        case "frog":
            return {
                summon: false,
                configs: {
                    mage: {
                        attack: new MageAttackStrategy(executors, {
                            type: "frog",
                            ensureEquipped: MAGE_DPS,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["frog"])
                    }
                },
                isActive: true
            };
        case "fvampire":
            return {
                summon: true,
                configs: {
                    warrior: {
                        attack: new WarriorAttackStrategy(executors, {
                            type: "fvampire",
                            ensureEquipped: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["fvampire"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(executors, {
                            type: "fvampire",
                            ensureEquipped: MAGE_DPS,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["fvampire"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(executors, {
                            type: "fvampire",
                            enableAbsorbToTank: true,
                            ensureEquipped: PRIEST_MF,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["fvampire"])
                    }
                },
                isActive: true
            };
        case "mvampire":
            return {
                summon: true,
                configs: {
                    warrior: {
                        attack: new WarriorAttackStrategy(executors, {
                            type: "mvampire",
                            ensureEquipped: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["mvampire"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(executors, {
                            type: "mvampire",
                            ensureEquipped: MAGE_DPS,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["mvampire"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(executors, {
                            type: "mvampire",
                            enableAbsorbToTank: true,
                            ensureEquipped: PRIEST_MF,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["mvampire"])
                    }
                },
                isActive: true
            };
        case "jr":
            return {
                summon: false,
                configs: {
                    mage: {
                        attack: new MageAttackStrategy(executors, {
                            type: "jr",
                            ensureEquipped: MAGE_DPS,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["jr"])
                    }
                },
                isActive: true
            };
        case "greenjr":
            return {
                summon: false,
                configs: {
                    mage: {
                        attack: new MageAttackStrategy(executors, {
                            type: "greenjr",
                            ensureEquipped: MAGE_DPS,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["greenjr"])
                    }
                },
                isActive: true
            };
        case "skeletor":
            return {
                summon: true,
                configs: {
                    warrior: {
                        attack: new WarriorAttackStrategy(executors, {
                            type: "skeletor",
                            ensureEquipped: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            disableStomp: true
                        }),
                        move: new BaseMoveStrategy(["skeletor"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(executors, {
                            type: "skeletor",
                            ensureEquipped: MAGE_DPS,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["skeletor"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(executors, {
                            type: "skeletor",
                            enableAbsorbToTank: true,
                            ensureEquipped: PRIEST_TANKY,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["skeletor"])
                    }
                },
                isActive: true
            };
    }
}