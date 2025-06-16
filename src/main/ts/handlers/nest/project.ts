import path from "path";
import { abortable, requires } from "@/lib/decorators";
import { Primitive } from "@/types/primitive";
import { Command } from "@cli/command";
import { Flag } from "@cli/flag";
import { Positional } from "@cli/positional";
import { UI } from "@/cli/ui";

export class NestProject {


    @abortable
    @requires("path", "dry-run", "skip-install")
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const inputpath = args.get("path") as string;
        const dryRun = args.get("dry-run") as boolean;

        let name: string = "";
        if (path.basename(path.resolve(inputpath)) === path.basename(inputpath)) {
            name = path.basename(path.resolve(inputpath))
        } else {
            name = await UI.ask("Enter a name for the project:");
        }

        console.log(name);
    }

    public static get command(): Command {
        return Command.builder()
            .setName("project")
            .setHelp("Generate a new NestJS project")
            .addArgument(new Positional("path", "The path where the project's files will be created", 0))
            .addArgument(new Flag("dry-run", "Show a preliminary view of the files to be created or modified", "--dry-run", "-dr"))
            .addArgument(new Flag("skip-install", "Declare NestJS dependencies to install, but do not automatically install them", "--skip-install", "--no-install"))
            .addArgument(new Flag("skip-git", "Do not initialize a git repository in the project's root.", "--skip-git", "--no-git"))
            .setAction(this.action)
            .build();
    }
}