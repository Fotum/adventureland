import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { KiteInCircleStrategy } from "../../strategies/move_strategies";
import { MAGE_DPS } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getStonewormQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                type: "stoneworm",
                equipmentSet: MAGE_DPS
            }),
            move: new KiteInCircleStrategy({
                centre: { map: "spookytown", x: 860, y: -14 },
                radius: 100,
                typeList: ["stoneworm"]
            })
        }
    };
}
