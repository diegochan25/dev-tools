import type { Action, CommandArgs } from "@/types";
import type { Argument } from "./argument";
import { Positional } from "./positional";
import { Optional } from "./optional";
import { Switch } from "./switch";
import { Write } from "./write";

export class Command {
    private name: string;
    private help: string;
    private args: Set<Argument>;
    private action: Action;

    private get positionals() {
        return Array.from(this.args).filter(arg => arg instanceof Positional);
    }
    private get optionals() {
        return Array.from(this.args).filter(arg => arg instanceof Optional);
    }
    private get switches() {
        return Array.from(this.args).filter(arg => arg instanceof Switch);
    }

    constructor({
        name,
        help,
        args,
        action
    }: CommandArgs) {
        this.name = name;
        this.help = help;
        this.args = args;
        this.action = action;
    }

    public helpString(): string {
        const help: string[] = [];

        help.push("=".repeat(100));
        help.push("Command '" + this.name + "'")
        help.push("-".repeat(100));
        help.push(this.help)
        help.push("-".repeat(100));
        help.push("Subcommands: ");

        help.push("Positional Arguments: ")
        if (this.positionals.length > 0) {
            this.positionals.forEach((p) => {
                help.push(`- ${p.name}: ${p.description}`);
            });
        } else {
            help.push("  None");
        }
        help.push("Optional Arguments:")
        if (this.optionals.length > 0) {
            this.optionals.forEach((o) => {
                help.push(`- ${o.name}: ${o.description}`);
            });
        } else {
            help.push("  None");
        }

        help.push("Flags:")
        if (this.switches.length > 0) {
            this.switches.forEach((s) => {
                help.push(`- ${s.name}: ${s.description}`);
            });
        } else {
            help.push("  None");
        }
        help.push("=".repeat(100));

        return help.join("\n");
    }

    parse(argv: string[]) {
        const entries = Array.from(this.args).map((arg) => arg.capture(argv).tuple());

        return new Map(entries); 
    }

}