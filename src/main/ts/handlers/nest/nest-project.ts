import { Primitive } from "@type/primitive";
import { UI } from "@cli/ui";
import { abortable, requires } from "@lib/decorators";
import path from "path";
import { Command } from "@cli/command";

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
            .setAction(this.action)
            .build();
    }
}