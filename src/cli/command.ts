import type { Action, CommandArgs } from "@/types";

export class Command {
    private name: string;
    private help: string;
    private action: Action;

    constructor({
        name,
        help,
        action
    }: CommandArgs) {
        this.name = name;
        this.help = help;
        this.action = action;
    }
}