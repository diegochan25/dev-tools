import path from "path";
import { Command } from "@cli/command";
import { FileModifyTemplate, Mode, Primitive } from "@/types";
import { abortable, requires } from "@lib/decorators";
import { Positional } from "@cli/positional";
import { File } from "@system/file";
import { Directory } from "@system/directory";
import { UI } from "@cli/ui";
import { CaseConverter } from "@/lib/case-converter";
import { templatepath } from "@/lib/consts";
import { Template } from "@/templates/template";
import { readModule, renderModule } from "@/lib/util";

export class NestController {
    @abortable
    @requires("path")
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
        file.touch();
        const contents = new Template(templatepath, template.template)
            .pass({
                names: names,
                useControllerPath: true,
                useService: workdir.files().some((f) => f === `${names.kebab}.service.ts`)
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
            const data = readModule(lines);
            if(!data.controllers.includes(`${names.pascal}Controller`)) {
                data.moduleImports.push(`import { ${names.pascal}Controller } from "./${names.kebab}.controller";`);
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

        UI.success("Controller '%s' successfully created!", name);
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