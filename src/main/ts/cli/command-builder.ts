import { ParserError } from "@/error/parser-error";
import type { CommandAction, Primitive } from "@/types";
import { Argument } from "./argument";
import { Command } from "./command";
import { UI } from "./ui";
import { Switch } from "./switch";


export class CommandBuilder {
    private parent: Command | null = null;
    private name: string = "";
    private help: string = "";
    private action: CommandAction = () => void UI.warning("Action not implemented.");
    private arguments: Argument[] = [];
    private subcommands: Command[] = [];

    public childOf(parent: Command): CommandBuilder {
        this.parent = parent;
        return this;
    }

    public addChild(child: Command): CommandBuilder {
        this.subcommands.push(child);
        return this;
    }

    public setName(name: string): CommandBuilder {
        this.name = name;
        return this;
    }

    public setHelp(help: string): CommandBuilder {
        this.help = help;
        return this;
    }

    public setAction(action: CommandAction): CommandBuilder {
        this.action = action;
        return this;
    }

    public addArgument(arg: Argument): CommandBuilder {
        this.arguments.push(arg);
        return this;
    }

    public build(): Command {
        if (!this.name) {
            throw new ParserError("Command cannot be built without a name");
        }
        if (!this.help) {
            throw new ParserError("Command cannot be built without a help string");
        }

        const command = new Command(this.name, this.help, this.action);
        command.arguments = this.arguments;
        command.subcommands = this.subcommands;
        if (this.parent) this.parent.subcommands.push(command);
        return command;
    }

    public static buildRoot(): Command {
        const cli = new Command(
            "devtools",
            "File creation utilities for languages and frameworks"
        );

        cli.arguments.push(new Switch({
            name: "version",
            description: "Show the version of the CLI tool.",
            flags: ["--version", "-v"]
        }));
        cli.action = (args: Map<string, Primitive>) => {
            if (args.get("version")) UI.echo(UI.white(`devtools v${Command.cliVersion}`));
        }

        return cli;
    }
}