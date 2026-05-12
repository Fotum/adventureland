import { PingCompensatedCharacter, type ServerIdentifier, type ServerRegion } from "alclient";
import { startCharacter } from "../base/functions/characters.js";
import { MY_CHARACTERS } from "../base/settings.js";
import { PartyController } from "../controller/party_controller.js";
import logger from "../logger.js";
import { CharacterRunner, type Strategy, type StrategyName } from "./character_runner.js";

export class AdminCommandStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    private partyController: PartyController;
    private _name: StrategyName = "admin";

    private onCodeEval: (data: string) => Promise<void>;

    public constructor(partyController: PartyController) {
        this.partyController = partyController;
    }

    public onApply(bot: T): void {
        this.onCodeEval = async (data: string) => {
            if (!data || data.length == 0) return;

            let splitCmd: string[] = data.split(" ");
            const cmd: string = splitCmd[0];
            const args: string[] = splitCmd.length > 1 ? splitCmd.slice(1) : [];

            switch (cmd.toLowerCase()) {
                case "shutdown": {
                    this.partyController.saveAndExit();
                    break;
                }
                case "deploy": {
                    if (args.length == 0) break;
                    if (this.partyController.getRunner(args[0])) break;

                    let serverRegion: ServerRegion = this.partyController.config.homeServerName;
                    let serverIdentifier: ServerIdentifier = this.partyController.config.homeServerId;
                    if (args.length == 3) {
                        serverRegion = args[1] as unknown as ServerRegion;
                        serverIdentifier = args[2] as unknown as ServerIdentifier;
                    }

                    let newRunner: CharacterRunner<PingCompensatedCharacter> = await startCharacter(
                        this.partyController,
                        args[0],
                        MY_CHARACTERS.get(args[0]),
                        serverRegion,
                        serverIdentifier
                    );
                    this.partyController.addRunner(newRunner);
                    break;
                }
                case "remove": {
                    if (args.length == 0) {
                        args[0] = bot.id;
                    }

                    this.partyController.removeRunner(args[0]);
                    break;
                }
                default:
                    logger.warn(`Received unknown command ${cmd}. Command was not executed`);
            }
        };

        bot.socket.on("code_eval", this.onCodeEval);
    }

    public onRemove(bot: T): void {
        if (this.onCodeEval) {
            bot.socket.off("code_eval", this.onCodeEval);
        }
    }

    public get name(): StrategyName {
        return this._name;
    }
}
