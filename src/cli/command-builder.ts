import { ParserError } from "@/error/parser-error";
import type { CommandAction } from "@/types/command-action";
import { Argument } from "./argument";
import { Command } from "./command";
import { UI } from "./ui";
import { Flag } from "./flag";
import { Primitive } from "@/types/primitive";


export class CommandBuilder {
    private parent: Command | null = null;
    private name: string = "";
    private help: string = "";
    private action: CommandAction = () => UI.echo(UI.yellow("Action not implemented."));
    private arguments: Argument[] = [];
    private subcommands: Command[] = [];

    public childOf(parent: Command): CommandBuilder {
        this.parent = parent;
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
        if (!this.parent) {
            throw new ParserError("Command cannot be built without a parent command");
        }

        const command = new Command(this.name, this.help, this.action);
        command.arguments = this.arguments;
        command.subcommands = this.subcommands;
        this.parent.subcommands.push(command);
        return command;
    }

    public static buildRoot(): Command {
        const cli = new Command(
            "devtools",
            "File creation utilities for languages and frameworks"
        );

        cli.arguments.push(new Flag("version", "Show the version of the CLI tool.", "--version", "-v"));
        cli.action = (args: Map<string, Primitive>) => {
            if (args.get("version")) UI.echo(UI.white(`devtools v${Command.cliVersion}`));
        }

        return cli;
    }
}