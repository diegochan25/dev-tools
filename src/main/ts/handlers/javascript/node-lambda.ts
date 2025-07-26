import { Command } from "@cli/command";
import { FileModifyTemplate, Mode, Primitive } from "@/types";
import { Positional } from "@cli/positional";
import { UI } from "@cli/ui";
import { abortable, requires, throws } from "@lib/decorators";
import { FileError } from "@error/file-error";
import { File } from "@system/file";
import { Directory } from "@system/directory";
import path from "path";
import { findVersion } from "@/lib/util";
import { Subprocess } from "@/system/subprocess";
import { Template } from "@/templates/template";
import { strings } from "@resources/strings";

export class NodeLambda {

    @abortable
    @requires("path")
    @throws(FileError)
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const inputpath = args.get("path") as string;

        const workdir = new Directory(path.resolve(inputpath));

        if (!workdir.exists) workdir.makedirs();

        let name: string = path.basename(workdir.abspath);
        if (path.basename(workdir.abspath) !== path.basename(inputpath)) {
            name = await UI.ask("Enter a name for the project:");
        }

        if (workdir.files().includes("package.json") && !new File(workdir.abspath, "package.json").empty) {
            UI.warning("A project already exists in the specified directory '%s'. Aborting to prevent overwriting.", workdir.abspath)
                .exit(1);
        }

        let scripts: { [key: string]: string } = {
            test: "node --test",
            start: "node index.js"
        };

        let dependencies: string[] = [
            "aws-sdk"
        ];

        let rootFiles: FileModifyTemplate[] = [
            {
                filename: "index.js",
                template: "javascript/index-lambda.ejs",
                mode: Mode.Write
            }
        ];


        const nodev = await UI.showLoading(findVersion("node", import.meta.dirname), "Finding Node...");

        if (!nodev) UI.error("Node.js was not found on this system.").exit(1);

        UI.info("Node version: %s", nodev);

        let npmv = await UI.showLoading(findVersion("npm", import.meta.dirname), "Finding npm...");
        let npm = "npm";

        if (!npmv) {
            npmv = await UI.showLoading(findVersion("npm.cmd", import.meta.dirname));
            npm = "npm.cmd"

            if (!npmv) UI.error("npm was not found on this system.").exit(1);
        }

        UI.info("npm version: %s", npmv);


        await UI.showLoading(
            new Subprocess([npm, "init", "-y"]).cwd(workdir.abspath).run(),
            "Initializing lambda project..."
        );

        UI.success("Lambda project initialized!");

        UI.echo("Modifying package.json...");

        const jsonFile = new File(workdir.abspath, "package.json");
        const packageJson = jsonFile.read().json();

        packageJson["name"] = name.toLowerCase();
        packageJson["version"] ??= "1.0.0";
        packageJson["type"] = "module";
        packageJson["main"] = "index.js";
        packageJson["scripts"] = scripts;

        jsonFile.writeJson(packageJson);

        UI.success("package.json modified!");

        await UI.showLoading(
            async () => {
                await new Subprocess([npm, "i", ...dependencies]).cwd(workdir.abspath).run();
            },
            "Installing dependencies..."
        );

        UI.success("Dependencies installed!");

        UI.echo("Creating project files...");

        rootFiles.forEach((t) => {
            const file = new File(workdir.abspath, t.filename);
            file.touch();
            let contents: string[] = [];
            if (t.template) {
                contents = new Template(strings.TEMPLATE_PATH, t.template)
                    .render()
                    .lines()
            }

            switch (t.mode) {
                case Mode.Append:
                    file.appendLines(contents);
                    break;
                case Mode.Create:
                case Mode.Write:
                    file.writeLines(contents);
                    break;
                case Mode.Remove:
                    file.rm();
                    break;
            }
        });

        UI.success("Project files created!");
        UI.success("Lambda project '%s' successfully created at '%s'!", name, workdir.abspath);

    }

    public static get command(): Command {
        return Command.builder()
            .setName("lambda")
            .setHelp("Create a Node.js lambda function project.")
            .addArgument(new Positional({
                name: "path",
                description: "The path where the Node.js lambda function will be created.",
                index: 0
            }))
            .setAction(this.action)
            .build();
    }
}