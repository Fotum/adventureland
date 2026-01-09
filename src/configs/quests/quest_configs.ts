import { MonsterName } from "alclient";
import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy, HoldPositionStrategy, KiteInCircleStrategy } from "../../strategies/move_strategies";
import { MAGE_AOE, MAGE_DPS, MAGE_FAST } from "../equipment_setups";
import { SpotConfig } from "../spots/spot_configs";


export function getQuestConfig(partyController: PartyController, questName: MonsterName): SpotConfig | undefined {
    switch (questName) {
        case "porcupine":
            return {
                mage: {
                    attack: new MageAttackStrategy(partyController, {
                        type: "porcupine",
                        notType: "plantoid",
                        equipmentSet: MAGE_FAST
                    }),
                    move: new HoldPositionStrategy({ position: { map: "desertland", x: -819, y: 179 } })
                }
            };
        case "bee":
            return {
                mage: {
                    attack: new MageAttackStrategy(partyController, {
                        typeList: ["bee", "cutebee"],
                        enableGreedyAggro: ["cutebee"],
                        equipmentSet: MAGE_AOE
                    }),
                    move: new HoldPositionStrategy({ position: { map: "main", x: 547, y: 1064 } })
                }
            };
        case "goo":
            return {
                mage: {
                    attack: new MageAttackStrategy(partyController, {
                        type: "goo",
                        enableGreedyAggro: true,
                        equipmentSet: MAGE_AOE
                    }),
                    move: new BaseMoveStrategy("goo")
                }
            };
        case "snake":
            return {
                mage: {
                    attack: new MageAttackStrategy(partyController, {
                        type: "snake",
                        enableGreedyAggro: true,
                        equipmentSet: MAGE_AOE
                    }),
                    move: new HoldPositionStrategy({ position: { map: "main", x: -62, y: 1895 } })
                }
            };
        case "crab":
            return {
                mage: {
                    attack: new MageAttackStrategy(partyController, {
                        typeList: ["crab", "phoenix"],
                        enableGreedyAggro: ["phoenix"],
                        equipmentSet: MAGE_FAST
                    }),
                    move: new BaseMoveStrategy("crab")
                }
            };
        case "rat":
            return {
                mage: {
                    attack: new MageAttackStrategy(partyController, {
                        type: "rat",
                        enableGreedyAggro: true,
                        equipmentSet: MAGE_FAST
                    }),
                    move: new BaseMoveStrategy("rat")
                }
            };
        case "squig":
            return {
                mage: {
                    attack: new MageAttackStrategy(partyController, {
                        typeList: ["squig", "squigtoad", "frog", "phoenix"],
                        enableGreedyAggro: ["frog", "phoenix"],
                        equipmentSet: MAGE_AOE
                    }),
                    move: new BaseMoveStrategy(["squig", "squigtoad", "frog"])
                }
            };
        case "stoneworm":
            return {
                mage: {
                    attack: new MageAttackStrategy(partyController, {
                        type: "stoneworm",
                        equipmentSet: MAGE_DPS
                    }),
                    move: new KiteInCircleStrategy({
                        centre: { map: "spookytown", x: 860, y: -14 },
                        radius: 300,
                        typeList: ["stoneworm"]
                    })
                }
            };
        case "crabx":
            return {
                mage: {
                    attack: new MageAttackStrategy(partyController, {
                        typeList: ["crabx", "phoenix"],
                        notType: "crabxx",
                        enableGreedyAggro: ["phoenix"],
                        equipmentSet: MAGE_AOE
                    }),
                    move: new BaseMoveStrategy(["crabx"])
                }
            };
        case "osnake":
            return {
                mage: {
                    attack: new MageAttackStrategy(partyController, {
                        type: "osnake",
                        enableGreedyAggro: true,
                        equipmentSet: MAGE_FAST
                    }),
                    move: new BaseMoveStrategy(["osnake"])
                }
            };
        case "minimush":
            return {
                mage: {
                    attack: new MageAttackStrategy(partyController, {
                        typeList: ["minimush", "phoenix"],
                        notType: "greenfairy",
                        enableGreedyAggro: ["phoenix", "minimush"],
                        equipmentSet: MAGE_AOE
                    }),
                    move: new HoldPositionStrategy({ position: { map: "halloween", x: 14, y: 414 } })
                }
            };
        case "bat":
            return {
                mage: {
                    attack: new MageAttackStrategy(partyController, {
                        typeList: ["bat", "phoenix", "mvampire"],
                        enableGreedyAggro: ["phoenix", "mvampire"],
                        equipmentSet: MAGE_AOE
                    }),
                    move: new BaseMoveStrategy(["bat", "phoenix", "mvampire"])
                }
            };
        case "armadillo":
            return {
                mage: {
                    attack: new MageAttackStrategy(partyController, {
                        typeList: ["armadillo", "phoenix"],
                        enableGreedyAggro: ["phoenix"],
                        equipmentSet: MAGE_AOE
                    }),
                    move: new HoldPositionStrategy({ position: { map: "main", x: 506, y: 1817 } })
                }
            };
        default:
            return undefined;
    }
}