import { Command } from "@cli/command";
import { FileModifyTemplate, Mode, ORMs, Primitive } from "@/types";
import { Positional } from "@cli/positional";
import { Directory } from "@system/directory";
import path from "path";
import { UI } from "@cli/ui";
import { CaseConverter } from "@lib/case-converter";
import { File } from "@system/file";
import { Template } from "@templates/template";
import { templatepath } from "@lib/consts";
import { Optional } from "@cli/optional";
import { abortable, throws, requires } from "@lib/decorators";
import { FileError } from "@/error/file-error";

export class NestEntity {
    @abortable
    @requires("path", "orm")
    @throws(FileError)
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const inputpath = args.get("path") as string;
        const orm = args.get("orm") as ORMs;
        const workdir = new Directory(path.resolve(inputpath));

        if (!workdir.exists) workdir.makedirs();

        let name: string = path.basename(workdir.abspath);
        if (path.basename(workdir.abspath) !== path.basename(inputpath)) {
            name = await UI.ask("Enter a name for the entity:");
        }

        const names = CaseConverter.convert(name);

        let template: FileModifyTemplate = {} as FileModifyTemplate;

        switch (orm) {
            case ORMs.TypeOrm:
                template = {
                    filename: `${names.kebab}.entity.ts`,
                    template: "nest/entity-typeorm.ejs",
                    mode: Mode.Write
                }
                break;
            case ORMs.Sequelize:
                template = {
                    filename: `${names.kebab}.entity.ts`,
                    template: "nest/entity-sequelize.ejs",
                    mode: Mode.Write
                }
                break;
            case ORMs.Prisma:
                template = {
                    filename: "schema.prisma",
                    template: "nest/entity-prisma.ejs",
                    mode: Mode.Append
                }
                break;
            case ORMs.MikroOrm:
                template = {
                    filename: `${names.kebab}.entity.ts`,
                    template: "nest/entity-mikroorm.ejs",
                    mode: Mode.Write
                }
                break;
        }

        const file = new File(workdir.abspath, template.filename);
        file.touch();
        const contents = new Template(templatepath, template.template)
            .pass({ names: names }).render().lines();
        
        if (template.mode === Mode.Write) {
            file.writeLines(contents);
        } else if (template.mode === Mode.Append) {
            file.appendLines(contents);
        }

        UI.success("Entity '%s' successfully created at '%s'!", names.pascal, workdir.abspath);
    }

    public static get command(): Command {
        return Command.builder()
            .setName("entity")
            .setHelp("Create a new NestJS entity.")
            .addArgument(new Positional({
                name: "path",
                description: "The path where the entity will be created.",
                index: 0
            }))
            .addArgument(new Optional({
                name: "orm",
                description: "The ORM syntax to be used when creating the entity",
                options: ORMs,
                base: ORMs.TypeOrm,
                flags: ["--orm"]
            }))
            .setAction(this.action)
            .build();
    }
}