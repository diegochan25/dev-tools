import path from "path";
import { Command } from "@cli/command";
import { FileModifyTemplate, Mode, Primitive } from "@/types";
import { Positional } from "@cli/positional";
import { Directory } from "@system/directory";
import { UI } from "@cli/ui";
import { CaseConverter } from "@lib/case-converter";
import { File } from "@system/file";
import { Template } from "@templates/template";
import { strings } from "@resources/strings";
import { abortable, throws, requires } from "@/lib/decorators";
import { FileError } from "@/error/file-error";
import { ConfigManager } from "@/config/config-manager";

export class NestResource {
    @abortable
    @requires("path")
    @throws(FileError)
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const inputpath = args.get("path") as string;
        const workdir = new Directory(path.resolve(inputpath));

        if (!workdir.exists) workdir.makedirs();

        let name: string = path.basename(workdir.abspath);
        if (path.basename(workdir.abspath) !== path.basename(inputpath)) {
            name = await UI.ask("Enter a name for the resource:");
        }

        const names = CaseConverter.convert(name);

        let files: FileModifyTemplate[] = [
            {
                filename: `${names.kebab}.module.ts`,
                template: "nest/module.ejs",
                mode: Mode.Write
            },
            {
                filename: `${names.kebab}.controller.ts`,
                template: "nest/controller.ejs",
                mode: Mode.Write
            },
            {
                filename: `${names.kebab}.service.ts`,
                template: "nest/service.ejs",
                mode: Mode.Write
            }
        ];

        files.forEach((t) => {
            const file = new File(workdir.abspath, t.filename);
            file.touch();
            const contents = new Template(strings.TEMPLATE_PATH, t.template)
                .pass({
                    names: names,
                    useController: true,
                    useControllerPath: true,
                    useService: true,
                    rules: ConfigManager.createRuleSet()
                })
                .render()
                .lines()
            switch (t.mode) {
                case Mode.Append:
                    file.appendLines(contents);
                case Mode.Create:
                case Mode.Write:
                    file.writeLines(contents);
                    break;
                case Mode.Remove:
                    file.rm();
                    break;
            }
        });

        UI.success("Resource '%s' successfully created with files '%s'!", name, files.map((f) => f.filename).join("', '"));
    }

    public static get command(): Command {
        return Command.builder()
            .setName("resource")
            .setHelp("Generate a new Nest REST resource.")
            .addArgument(new Positional({
                name: "path",
                description: "The path where the project will be created.",
                index: 0
            }))
            .setAction(this.action)
            .build();
    }
}