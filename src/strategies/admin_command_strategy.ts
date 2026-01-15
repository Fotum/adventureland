import { CharacterType, PingCompensatedCharacter, ServerIdentifier, ServerRegion } from "alclient";
import { startCharacter } from "../base/functions/general";
import { PartyController } from "../controller/party_controller";
import { CharacterRunner, Strategy, StrategyName } from "./character_runner";

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
                    if (args.length < 4) break;
                    if (this.partyController.getRunner(args[0])) break;

                    let ctype: CharacterType = args[1] as CharacterType;
                    let newRunner: CharacterRunner<PingCompensatedCharacter> = await startCharacter(
                        this.partyController,
                        args[0],
                        ctype,
                        args[2] as ServerRegion,
                        args[3] as ServerIdentifier
                    );
                    if (!newRunner) {
                        console.error(`Error deploying character ${args[0]}`);
                        break;
                    }

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
                    console.warn(`Received unknown command ${cmd}. Command was not executed`);
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
