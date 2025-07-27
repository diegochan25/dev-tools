import path from "path";
import { Command } from "@cli/command";
import { FileModifyTemplate, Mode, Primitive } from "@/types";
import { abortable, throws, requires } from "@lib/decorators";
import { Positional } from "@cli/positional";
import { File } from "@system/file";
import { Directory } from "@system/directory";
import { UI } from "@cli/ui";
import { CaseConverter } from "@/lib/case-converter";
import { strings } from "@resources/strings";
import { Template } from "@/templates/template";
import { readModule, renderModule } from "@/lib/util";
import { FileError } from "@/error/file-error";
import { ConfigManager } from "@/config/config-manager";

export class NestController {
    @abortable
    @requires("path")
    @throws(FileError)
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const inputpath = args.get("path") as string;
        const workdir = new Directory(path.resolve(inputpath));

        if (!workdir.exists) workdir.makedirs();

        let name: string = path.basename(workdir.abspath);
        if (path.basename(workdir.abspath) !== path.basename(inputpath)) {
            name = await UI.ask("Enter a name for the controller:");
        }

        const names = CaseConverter.convert(name);

        const template: FileModifyTemplate = {
            filename: `${names.kebab}.controller.ts`,
            template: "nest/controller.ejs",
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
                useControllerPath: true,
                useService: workdir.files().some((f) => f === `${names.kebab}.service.ts`),
                rules: ConfigManager.createRuleSet()
            })
            .render()
            .lines()

        file.writeLines(contents);

        const modulepath: string =
            workdir.files().find((f) => f === `${names.kebab}.module.ts`)
            ||
            workdir.files().find((f) => f.endsWith(".module.ts"))
            ||
            "";

        if (modulepath) {
            const lines = new File(workdir.abspath, modulepath).read().lines();
            const { quote, objectSpace, semicolon } = ConfigManager.createRuleSet().javascript;
            const data = readModule(lines);
            if (!data.controllers.includes(`${names.pascal}Controller`)) {
                data.moduleImports.push(`import {${objectSpace}${names.pascal}Controller${objectSpace}} from ${quote}./${names.kebab}.controller${quote}${semicolon}`);
                data.controllers.push(`${names.pascal}Controller`)
            }
            const module = renderModule(names, data);

            new File(workdir.abspath, modulepath).writeLines(module);
        } else {
            UI.warning(
                "No module found on directory '%s'. Consider adding a module before implementing '%sController'",
                workdir.abspath,
                names.pascal
            );
        }

        UI.success("Controller '%sController' successfully created at '%s'!", names.pascal, workdir.abspath);
    }

    public static get command(): Command {
        return Command.builder()
            .setName("controller")
            .setHelp("Create a NestJS controller.")
            .addArgument(new Positional({
                name: "path",
                description: "The path where the NestJS controller will be created.",
                index: 0
            }))
            .setAction(this.action)
            .build();
    }
}