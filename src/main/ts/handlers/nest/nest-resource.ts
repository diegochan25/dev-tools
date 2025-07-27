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
import { findPackageJson, readModule, renderModule } from "@/lib/util";

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

            if (file.exists && !file.empty) {
                UI.error("File '%s' already exists and is not empty. Aborting to avoid overwriting", file.abspath)
                    .exit(1);
            }

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

        const modulefile = new File(path.join(findPackageJson(workdir.abspath), "src", "app.module.ts"));
        
        if (modulefile.exists) {
            const lines = modulefile.read().lines();
            const { quote, objectSpace, semicolon } = ConfigManager.createRuleSet().javascript;
            const data = readModule(lines);
            if (!data.imports.includes(`${names.pascal}Module`)) {
                data.moduleImports.push(`import {${objectSpace}${names.pascal}Module${objectSpace}} from ${quote}./${names.kebab}/${names.kebab}.module${quote}${semicolon}`);
                data.imports.push(`${names.pascal}Module`)
            }
            const module = renderModule(names, data);

            modulefile.writeLines(module);
        } else {
            UI.warning(
                "Module 'AppModule' was not found at 'src' directory. Consider adding the 'AppModule' module before implementing '%sModule'",
                names.pascal
            );
        }

        UI.success("Resource '%s' successfully created with files '%s'!", name, files.map((f) => f.filename).join("', '"))
            .exit(0);
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