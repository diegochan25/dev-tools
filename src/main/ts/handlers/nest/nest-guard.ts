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

export class NestGuard {
    @abortable
    @requires("path")
    @throws(FileError)
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const inputpath = args.get("path") as string;
        const workdir = new Directory(path.resolve(inputpath));

        if (!workdir.exists) workdir.makedirs();

        let name: string = path.basename(workdir.abspath);
        if (path.basename(workdir.abspath) !== path.basename(inputpath)) {
            name = await UI.ask("Enter a name for the guard:");
        }

        const names = CaseConverter.convert(name);

        const template: FileModifyTemplate = {
            filename: `${names.kebab}.guard.ts`,
            template: "nest/guard.ejs",
            mode: Mode.Write
        }

        const file = new File(workdir.abspath, template.filename);
        file.touch();
        const contents = new Template(strings.TEMPLATE_PATH, template.template)
            .pass({ names, rules: ConfigManager.createRuleSet()})
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
            if(!data.providers.includes(`${names.pascal}Guard`)) {
                data.moduleImports.push(`import { ${names.pascal}Guard } from "./${names.kebab}.guard";`);
                data.providers.push(`${names.pascal}Guard`)
            }
            const module = renderModule(names, data);

            new File(workdir.abspath, modulepath).writeLines(module);
        } else {
            UI.warning(
                "No module found on directory '%s'. Consider adding a module before implementing '%sGuard'", 
                workdir.abspath, 
                names.pascal
            );
        }

        UI.success("Guard '%sGuard' successfully created at '%s'!", names.pascal, workdir.abspath);
    }

    public static get command(): Command {
        return Command.builder()
            .setName("guard")
            .setHelp("Create a NestJS guard.")
            .addArgument(new Positional({
                name: "path",
                description: "The path where the NestJS guard will be created.",
                index: 0
            }))
            .setAction(this.action)
            .build();
    }
}