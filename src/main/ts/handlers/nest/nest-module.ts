import path from "path";
import { Command } from "@cli/command";
import { Positional } from "@cli/positional";
import { UI } from "@cli/ui";
import { CaseConverter } from "@lib/case-converter";
import { templatepath } from "@lib/consts";
import { Directory } from "@system/directory";
import { File } from "@system/file";
import { Template } from "@templates/template";
import { FileModifyTemplate, Mode, Primitive } from "@/types";

export class NestModule {
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
        file.touch();
        const contents = new Template(templatepath, template.template)
            .pass({
                names: names,
                useController: workdir.files().some((f) => f === `${names.kebab}.controller.ts`),
                useControllerPath: true,
                useService: workdir.files().some((f) => f === `${names.kebab}.service.ts`)
            })
            .render()
            .lines()

        file.writeLines(contents);

        UI.success("Resource '%s' successfully created!", name);
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