import { PackageManagers, Primitive } from "@/types";
import { UI } from "@cli/ui";
import { abortable, requires } from "@lib/decorators";
import path from "path";
import { Command } from "@cli/command";
import { Positional } from "@cli/positional";
import { Optional } from "@cli/optional";

export class NestProject {
    @abortable
    @requires("path", "package-manager")
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const inputpath = args.get("path") as string;
        const packageManager = args.get("package-manager") as string;

        const abspath: string = path.resolve(inputpath);
        let name: string = path.basename(abspath);
        if (path.basename(abspath) !== path.basename(inputpath)) {
            name = await UI.ask("Enter a name for the project:");
        }
    }

    public static get command(): Command {
        return Command.builder()
            .setName("project")
            .setHelp("Generate a new NestJS project")
            .addArgument(new Positional({
                name: "path",
                description: "The path where the project will be created.",
                index: 0
            }))
            .addArgument(new Optional({
                name: "package-manager",
                description: "The package manager that will be used when building and scaffolding the project.",
                base: "npm",
                options: PackageManagers,
                flags: ["--package-manager", "-pm"]
            }))
            .setAction(this.action)
            .build();
    }
}