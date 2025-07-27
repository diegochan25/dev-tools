import path from "path";
import { Command } from "@cli/command";
import { Positional } from "@cli/positional";
import { UI } from "@cli/ui";
import { CaseConverter } from "@lib/case-converter";
import { strings } from "@resources/strings";
import { Directory } from "@system/directory";
import { File } from "@system/file";
import { Template } from "@templates/template";
import { FileModifyTemplate, Mode, Primitive } from "@/types";
import { abortable, throws, requires } from "@lib/decorators";
import { FileError } from "@/error/file-error";
import { ConfigManager } from "@/config/config-manager";
import { findPackageJson, readModule, renderModule } from "@/lib/util";

export class NestModule {
    @abortable
    @requires("path")
    @throws(FileError)
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const inputpath = args.get("path") as string;
        const workdir = new Directory(path.resolve(inputpath));

        if (!workdir.exists) workdir.makedirs();

        let name: string = path.basename(workdir.abspath);
        if (path.basename(workdir.abspath) !== path.basename(inputpath)) {
            name = await UI.ask("Enter a name for the module:");
        }

        const names = CaseConverter.convert(name);

        const template: FileModifyTemplate = {
            filename: `${names.kebab}.module.ts`,
            template: "nest/module.ejs",
            mode: Mode.Write
        }

        const file = new File(workdir.abspath, template.filename);

        if (file.exists && !file.empty) {
            UI.error("File '%s' already exists and is not empty. Aborting to avoid overwriting", file.abspath)
                .exit(1);
        }

        file.touch();
        const contents = new Template(strings.TEMPLATE_PATH, template.template)
            .pass({
                names: names,
                useController: workdir.files().some((f) => f === `${names.kebab}.controller.ts`),
                useControllerPath: true,
                useService: workdir.files().some((f) => f === `${names.kebab}.service.ts`),
                rules: ConfigManager.createRuleSet()
            })
            .render()
            .lines()

        file.writeLines(contents);

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

        UI.success("Module '%sModule' successfully created at '%s'!", names.pascal, workdir.abspath).exit(0);
    }

    public static get command(): Command {
        return Command.builder()
            .setName("module")
            .setHelp("Create a new NestJS module.")
            .addArgument(new Positional({
                name: "path",
                description: "The path where the module will be created.",
                index: 0
            }))
            .setAction(this.action)
            .build();
    }
}