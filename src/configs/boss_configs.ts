import { CharacterType, PingCompensatedCharacter } from "alclient";
import { PartyController } from "../controller/party_controller";
import { Strategy } from "../strategies/character_runner";
import { MageAttackStrategy } from "../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../strategies/move_strategy";
import { PriestAttackStrategy } from "../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../strategies/warrior/warrior_attack_strategy";
import { MAGE_AOE, MAGE_DPS, MAGE_FAST, PRIEST_GF, PRIEST_MF, PRIEST_TANKY, WARRIOR_AOE, WARRIOR_DPS } from "./equipment_setups";


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


export function getEventConfig(eventName: SpecialName | EventName, partyController: PartyController): EventConfig {
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
                        attack: new WarriorAttackStrategy(partyController, {
                            typeList: ["pinkgoo", "bgoo", "rgoo"],
                            disableIdleAttack: true,
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            disableStomp: true,
                            enableEquipForCleave: true
                        }),
                        move: new BaseMoveStrategy(["pinkgoo", "bgoo", "rgoo"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            typeList: ["pinkgoo", "bgoo", "rgoo"],
                            disableIdleAttack: true,
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            disableScare: true,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["pinkgoo", "bgoo", "rgoo"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            typeList: ["pinkgoo", "bgoo", "rgoo"],
                            disableIdleAttack: true,
                            enableGreedyAggro: true,
                            maximumTargets: 15,
                            enableAbsorbToTank: true,
                            equipmentSet: PRIEST_GF,
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
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "dragold",
                            disableIdleAttack: true,
                            equipmentSet: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            disableStomp: true
                        }),
                        move: new BaseMoveStrategy(["dragold"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "dragold",
                            disableIdleAttack: true,
                            equipmentSet: MAGE_DPS,
                            disableCburst: true,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["dragold"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "dragold",
                            disableIdleAttack: true,
                            enableAbsorbToTank: true,
                            maximumTargets: 3,
                            equipmentSet: PRIEST_TANKY,
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
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "icegolem",
                            disableIdleAttack: true,
                            equipmentSet: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            disableStomp: true
                        }),
                        move: new BaseMoveStrategy(["icegolem"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "icegolem",
                            disableIdleAttack: true,
                            equipmentSet: MAGE_DPS,
                            disableKillSteal: true,
                            disableCburst: true,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["icegolem"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "icegolem",
                            disableIdleAttack: true,
                            enableAbsorbToTank: true,
                            maximumTargets: 3,
                            equipmentSet: PRIEST_TANKY,
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
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "pinkgoo",
                            disableIdleAttack: true,
                            equipmentSet: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            disableStomp: true
                        }),
                        move: new BaseMoveStrategy(["pinkgoo"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "pinkgoo",
                            disableIdleAttack: true,
                            equipmentSet: MAGE_FAST,
                            disableKillSteal: true,
                            disableCburst: true,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["pinkgoo"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "pinkgoo",
                            disableIdleAttack: true,
                            equipmentSet: PRIEST_MF,
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
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "snowman",
                            equipmentSet: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            disableStomp: true
                        }),
                        move: new BaseMoveStrategy(["snowman"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "snowman",
                            equipmentSet: MAGE_FAST,
                            disableKillSteal: true,
                            disableCburst: true,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["snowman"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "snowman",
                            equipmentSet: PRIEST_MF,
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
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "phoenix",
                            equipmentSet: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["phoenix"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "phoenix",
                            equipmentSet: MAGE_DPS,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["phoenix"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "phoenix",
                            equipmentSet: PRIEST_MF,
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
                        attack: new MageAttackStrategy(partyController, {
                            type: "frog",
                            equipmentSet: MAGE_DPS,
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
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "fvampire",
                            equipmentSet: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["fvampire"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "fvampire",
                            equipmentSet: MAGE_DPS,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["fvampire"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "fvampire",
                            enableAbsorbToTank: true,
                            equipmentSet: PRIEST_MF,
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
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "mvampire",
                            equipmentSet: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["mvampire"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "mvampire",
                            equipmentSet: MAGE_DPS,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["mvampire"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "mvampire",
                            enableAbsorbToTank: true,
                            equipmentSet: PRIEST_MF,
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
                        attack: new MageAttackStrategy(partyController, {
                            type: "jr",
                            equipmentSet: MAGE_DPS,
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
                        attack: new MageAttackStrategy(partyController, {
                            type: "greenjr",
                            equipmentSet: MAGE_DPS,
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
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "skeletor",
                            equipmentSet: WARRIOR_DPS,
                            disableAgitate: true,
                            disableCleave: true,
                            disableStomp: true
                        }),
                        move: new BaseMoveStrategy(["skeletor"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "skeletor",
                            equipmentSet: MAGE_DPS,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["skeletor"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "skeletor",
                            enableAbsorbToTank: true,
                            equipmentSet: PRIEST_TANKY,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["skeletor"])
                    }
                },
                isActive: true
            };
    }
}