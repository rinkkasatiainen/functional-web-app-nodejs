import {Result} from "../actions/action";

declare global {
    type CommandStatusTypes = "created" | "ok" | "internal-error";
    interface CommandStatus {status: CommandStatusTypes; text?: string; }
}
