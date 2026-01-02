import { CharacterType, IPosition, PingCompensatedCharacter } from "alclient";
import { PartyController } from "../controller/party_controller";
import { Strategy } from "../strategies/character_runner";
import { MageAttackStrategy } from "../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy, FarmingMoveStrategy, HoldPositionStrategy, MoveAroundStrategy } from "../strategies/move_strategy";
import { PriestAttackStrategy } from "../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../strategies/warrior/warrior_attack_strategy";
import { MAGE_AOE, PRIEST_MF, PRIEST_TANKY, WARRIOR_AOE } from "./equipment_setups";


export type SpotName = "cave_first" | "cave_second" | "stoneworm" | "booboo" | "bees" | "crabs" | "crabxs" | 
                        "squigs" | "tortoise" | "croc" | "armadillo" | "rats" | "moles" | "porcupine" | "goos" | 
                        "snakes" | "cgoo" | "iceroamer" | "osnake" | "minimush" | "bigbird" | "scorpion" | "spider";

export type SpotConfig = {
    farmArea: {
        area: { x: number, y: number, d: number }
        position: IPosition
    }
    farmOptions: {
        [T in CharacterType]?: {
            attack?: Strategy<PingCompensatedCharacter>,
            move?: Strategy<PingCompensatedCharacter>
        }
    }
}

export function getSpotConfig(spotName: SpotName, partyController: PartyController): SpotConfig {
    let defaultEnergize = {
        onMpRatio: 0.8,
        when: { 
            mpRatio: 0.1
        }
    };

    switch (spotName) {
        case "cave_first":
            return {
                farmArea: {
                    area: { x: 70, y: -1300, d: 550 },
                    position: { x: 377, y: -1075, map: "cave" }
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            typeList: ["bat", "goldenbat", "phoenix", "mvampire"],
                            enableGreedyAggro: false,
                            maximumTargets: 15,
                            equipmentSet: WARRIOR_AOE,
                            disableStomp: false,
                            enableEquipForCleave: true,
                            enableEquipForStomp: false
                        }),
                        move: new BaseMoveStrategy(["bat", "goldenbat", "phoenix", "mvampire"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            typeList: ["bat", "goldenbat", "phoenix", "mvampire"],
                            enableGreedyAggro: ["goldenbat"],
                            maximumTargets: 10,
                            equipmentSet: MAGE_AOE,
                            disableCburst: false,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["bat", "goldenbat", "phoenix", "mvampire"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            typeList: ["bat", "goldenbat", "phoenix", "mvampire"],
                            enableGreedyAggro: true,
                            maximumTargets: 15,
                            equipmentSet: PRIEST_MF,
                            disableCurse: true,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["bat", "goldenbat", "phoenix", "mvampire"])
                    },
                    merchant: {
                        move: new HoldPositionStrategy({ x: 331, y: -831, map: "cave" })
                    }
                }
            };
        case "cave_second":
            return {
                farmArea: {
                    area: { x: 1282, y: -19, d: 300 },
                    position: { x: 1282, y: -19, map: "cave" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            typeList: ["bat", "goldenbat", "phoenix", "mvampire"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["bat", "goldenbat", "phoenix", "mvampire"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            typeList: ["bat", "goldenbat", "phoenix", "mvampire"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["bat", "goldenbat", "phoenix", "mvampire"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            typeList: ["bat", "goldenbat", "phoenix", "mvampire"],
                            enableGreedyAggro: true,
                            maximumTargets: 10,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["bat", "goldenbat", "phoenix", "mvampire"])
                    }
                }
            };
        case "stoneworm":
            return {
                farmArea: {
                    area: { x: 860, y: -14, d: 250 },
                    position: { x: 795, y: -41, map: "spookytown" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "stoneworm",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["stoneworm"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "stoneworm",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["stoneworm"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "stoneworm",
                            enableGreedyAggro: true,
                            maximumTargets: 10,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["stoneworm"])
                    }
                }
            };
        case "booboo":
            return {
                farmArea: {
                    area: { x: 400, y: -700, d: 200 },
                    position: { x: 155, y: -556, map: "spookytown" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "booboo",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["booboo"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "booboo",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["booboo"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "booboo",
                            enableGreedyAggro: true,
                            maximumTargets: 10,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["booboo"])
                    }
                }
            };
        case "bees":
            return {
                farmArea: {
                    area: { x: 547, y: 1064, d: 150 },
                    position: { x: 547, y: 1064, map: "main" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            typeList: ["bee", "cutebee"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["bee", "cutebee"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            typeList: ["bee", "cutebee"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["bee", "cutebee"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            typeList: ["bee", "cutebee"],
                            enableGreedyAggro: true,
                            maximumTargets: 10,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["bee", "cutebee"])
                    }
                }
            };
        case "crabs":
            return {
                farmArea: {
                    area: { x: -1202, y: -66, d: 200 },
                    position: { x: -1202, y: -66, map: "main" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            typeList: ["crab", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["crab", "phoenix"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            typeList: ["crab", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["crab", "phoenix"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            typeList: ["crab", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 10,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["crab", "phoenix"])
                    }
                }
            };
        case "crabxs":
            return {
                farmArea: {
                    area: { x: -964, y: 1788, d: 250 },
                    position: { x: -964, y: 1788, map: "main" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            typeList: ["crabx", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["crabx", "phoenix"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            typeList: ["crabx", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["crabx", "phoenix"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            typeList: ["crabx", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 10,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["crabx", "phoenix"])
                    }
                }
            };
        case "squigs":
            return {
                farmArea: {
                    area: { x: -1150, y: 424, d: 300 },
                    position: { x: -1150, y: 424, map: "main" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            typeList: ["squig", "squigtoad", "frog", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["squig", "squigtoad", "frog", "phoenix"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            typeList: ["squig", "squigtoad", "frog", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["squig", "squigtoad", "frog", "phoenix"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            typeList: ["squig", "squigtoad", "frog", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 10,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["squig", "squigtoad", "frog", "phoenix"])
                    }
                }
            };
        case "tortoise":
            return {
                farmArea: {
                    area: { x: -1105, y: 1138, d: 370 },
                    position: { x: -1105, y: 1138, map: "main" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            typeList: ["tortoise", "frog", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["tortoise", "frog", "phoenix"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            typeList: ["tortoise", "frog", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["tortoise", "frog", "phoenix"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            typeList: ["tortoise", "frog", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 10,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["tortoise", "frog", "phoenix"])
                    }
                }
            };
        case "croc":
            return {
                farmArea: {
                    area: { x: 780, y: 1714, d: 300 },
                    position: { x: 798, y: 1576, map: "main" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            typeList: ["croc", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["croc", "phoenix"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            typeList: ["croc", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["croc", "phoenix"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            typeList: ["croc", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 10,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["croc", "phoenix"])
                    }
                }
            };
        case "armadillo":
            return {
                farmArea: {
                    area: { x: 506, y: 1817, d: 200 },
                    position: { x: 506, y: 1817, map: "main" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            typeList: ["armadillo", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["armadillo", "phoenix"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            typeList: ["armadillo", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["armadillo", "phoenix"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            typeList: ["armadillo", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 10,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["armadillo", "phoenix"])
                    }
                }
            };
        case "rats":
            return {
                farmArea: {
                    area: { x: -5, y: -173, d: 200 },
                    position: { x: -5, y: -173, map: "mansion" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "rat",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["rat"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "rat",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["rat"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "rat",
                            enableGreedyAggro: true,
                            maximumTargets: 10,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["rat"])
                    }
                }
            };
        case "moles":
            return {
                farmArea: {
                    area: { x: 0, y: -350, d: 350 },
                    position: { x: -1, y: -63, map: "tunnel" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "mole",
                            notType: "wabbit",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["mole"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "mole",
                            notType: "wabbit",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["mole"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "mole",
                            notType: "wabbit",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: PRIEST_TANKY,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["mole"])
                    },
                    merchant: {
                        move: new HoldPositionStrategy({ x: 242, y: -21, map: "tunnel" })
                    }
                }
            };
        case "porcupine":
            return {
                farmArea: {
                    area: { x: -819, y: 179, d: 200 },
                    position: { x: -819, y: 179, map: "desertland" },
                },
                farmOptions: {
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "porcupine",
                            notType: "plantoid",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["porcupine"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "porcupine",
                            notType: "plantoid",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["porcupine"])
                    },
                    merchant: {
                        move: new HoldPositionStrategy({ x: -585, y: 320, map: "desertland" })
                    }
                }
            };
        case "goos":
            return {
                farmArea: {
                    area: { x: -62, y: 789, d: 250 },
                    position: { x: -62, y: 789, map: "main" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "goo",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["goo"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "goo",
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["goo"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "goo",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["goo"])
                    },
                    merchant: {
                        move: new HoldPositionStrategy({ x: -1, y: 648, map: "main" })
                    }
                }
            };
        case "snakes":
            return {
                farmArea: {
                    area: { x: -62, y: 1895, d: 200 },
                    position: { x: -62, y: 1895, map: "main" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "snake",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["snake"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "snake",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["snake"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "snake",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["snake"])
                    },
                    merchant: {
                        move: new HoldPositionStrategy({ x: -234, y: 1751, map: "main" })
                    }
                }
            };
        case "cgoo":
            return {
                farmArea: {
                    area: { x: 136, y: -126, d: 9999 },
                    position: { x: 136, y: -126, map: "arena" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "cgoo",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["cgoo"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "cgoo",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["cgoo"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "cgoo",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["cgoo"])
                    }
                }
            };
        case "iceroamer":
            return {
                farmArea: {
                    area: { x: 863, y: -47, d: 370 },
                    position: { x: 534, y: 14, map: "winterland" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "iceroamer",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["iceroamer"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "iceroamer",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["iceroamer"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "iceroamer",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["iceroamer"])
                    }
                }
            };
        case "osnake":
            return {
                farmArea: {
                    area: { x: -530, y: -508, d: 300 },
                    position: { x: -519, y: -234, map: "halloween" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "osnake",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["osnake"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "osnake",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["osnake"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "osnake",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["osnake"])
                    },
                    merchant: {
                        move: new HoldPositionStrategy( {x: -519, y: -234, map: "halloween"} )
                    }
                }
            };
        case "minimush":
            return {
                farmArea: {
                    area: { x: 19, y: 636, d: 300 },
                    position: { x: 14, y: 414, map: "halloween" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            typeList: ["minimush", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["minimush", "phoenix"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            typeList: ["minimush", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["minimush", "phoenix"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            typeList: ["minimush", "phoenix"],
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["minimush", "phoenix"])
                    },
                    merchant: {
                        move: new HoldPositionStrategy( {x: 14, y: 414, map: "halloween"} )
                    }
                }
            };
        case "bigbird":
            return {
                farmArea: {
                    area: { x: 1345, y: 309, d: 250 },
                    position: { x: 1241, y: 457, map: "main" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            type: "bigbird",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new BaseMoveStrategy(["bigbird"])
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            type: "bigbird",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: MAGE_AOE,
                            energize: defaultEnergize
                        }),
                        move: new BaseMoveStrategy(["bigbird"])
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            type: "bigbird",
                            enableGreedyAggro: true,
                            maximumTargets: 5,
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new BaseMoveStrategy(["bigbird"])
                    },
                    merchant: {
                        move: new HoldPositionStrategy( {x: 1378, y: 418, map: "main"} )
                    }
                }
            };
        case "scorpion":
            return {
                farmArea: {
                    area: { x: 1551, y: -164, d: 250 },
                    position: { x: 1309, y: -215, map: "main" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            typeList: ["scorpion", "phoenix"],
                            enableGreedyAggro: true,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new FarmingMoveStrategy(["phoenix", "scorpion"], { x: 1309, y: -215, map: "main" })
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            typeList: ["scorpion", "phoenix"],
                            enableGreedyAggro: true,
                            equipmentSet: MAGE_AOE,
                            disableCburst: true,
                            energize: defaultEnergize
                        }),
                        move: new FarmingMoveStrategy(["phoenix", "scorpion"], { x: 1309, y: -215, map: "main" })
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            typeList: ["scorpion", "phoenix"],
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            disableScare: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new MoveAroundStrategy(["phoenix", "scorpion"], {
                            position: { x: 1309, y: -215, map: "main" },
                            kitingOpts: { radius: 30, minDistToMove: 10 }
                        })
                    },
                    merchant: {
                        move: new HoldPositionStrategy({x: 1308, y: -331, map: "main"})
                    }
                }
            };
        case "spider":
            return {
                farmArea: {
                    area: { x: 923, y: -164, d: 250 },
                    position: { x: 1309, y: -215, map: "main" },
                },
                farmOptions: {
                    warrior: {
                        attack: new WarriorAttackStrategy(partyController, {
                            typeList: ["spider", "phoenix"],
                            enableGreedyAggro: true,
                            equipmentSet: WARRIOR_AOE,
                            enableEquipForCleave: true,
                            enableEquipForStomp: true
                        }),
                        move: new FarmingMoveStrategy(["phoenix", "spider"], { x: 1309, y: -215, map: "main" })
                    },
                    mage: {
                        attack: new MageAttackStrategy(partyController, {
                            typeList: ["spider", "phoenix"],
                            enableGreedyAggro: true,
                            equipmentSet: MAGE_AOE,
                            disableCburst: true,
                            energize: defaultEnergize
                        }),
                        move: new FarmingMoveStrategy(["phoenix", "spider"], { x: 1309, y: -215, map: "main" })
                    },
                    priest: {
                        attack: new PriestAttackStrategy(partyController, {
                            typeList: ["spider", "phoenix"],
                            equipmentSet: PRIEST_MF,
                            enableAbsorbToTank: true,
                            disableScare: true,
                            startHealingAtRatio: 0.8
                        }),
                        move: new MoveAroundStrategy(["phoenix", "spider"], {
                            position: { x: 1309, y: -215, map: "main" },
                            kitingOpts: { radius: 30, minDistToMove: 10 }
                        })
                    },
                    merchant: {
                        move: new HoldPositionStrategy({x: 1308, y: -331, map: "main"})
                    }
                }
            };
    }
}