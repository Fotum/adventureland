import { Mage } from "alclient";
import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { MAGE_AOE, MAGE_DPS } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

class MageBatQuestStrategy extends MageAttackStrategy {
    protected attack(bot: Mage): Promise<void> {
        let entity = bot.getEntity({ type: "bat", returnHighestLevel: true });
        if (entity && entity.level > 10) {
            this.config.maximumTargets = 1;
            this.config.equipmentSet = MAGE_DPS;
        } else if (entity && entity.level > 5) {
            this.config.maximumTargets = 3;
            this.config.equipmentSet = MAGE_AOE;
        } else {
            this.config.maximumTargets = undefined;
            this.config.equipmentSet = MAGE_AOE;
        }

        return super.attack(bot);
    }
}

export function getBatQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageBatQuestStrategy(partyController, {
                typeList: ["bat", "phoenix", "mvampire"],
                enableGreedyAggro: true,
                equipmentSet: MAGE_AOE
            }),
            move: new BaseMoveStrategy(["bat", "phoenix", "mvampire"])
        }
    };
}
