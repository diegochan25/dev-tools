import { Command } from "@cli/command";
import { FileModifyTemplate, Mode, Primitive } from "@/types";
import { Positional } from "@cli/positional";
import { Directory } from "@system/directory";
import path from "path";
import { UI } from "@cli/ui";
import { CaseConverter } from "@lib/case-converter";
import { File } from "@system/file";
import { Template } from "@templates/template";
import { strings } from "@resources/strings";
import { Optional } from "@cli/optional";
import { abortable, throws, requires } from "@lib/decorators";
import { FileError } from "@/error/file-error";
import { NestDbSyntaxRule, NestORMRule } from "@/config/config-rules";
import { ConfigManager } from "@/config/config-manager";

export class NestEntity {
    @abortable
    @requires("path", "orm", "syntax")
    @throws(FileError)
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const inputpath = args.get("path") as string;
        const orm = args.get("orm") as NestORMRule;
        const syntax = args.get("syntax") as NestDbSyntaxRule;
        const workdir = new Directory(path.resolve(inputpath));

        if (orm === NestORMRule.Sequelize && syntax === NestDbSyntaxRule.MongoDB) {
            UI.error("ORM 'Sequelize' does not support MongoDB syntax.").exit(1);
        }

        if (!workdir.exists) workdir.makedirs();

        let name: string = path.basename(workdir.abspath);
        if (path.basename(workdir.abspath) !== path.basename(inputpath)) {
            name = await UI.ask("Enter a name for the entity:");
        }

        const names = CaseConverter.convert(name);

        let template: FileModifyTemplate;

        switch (orm) {
            case NestORMRule.TypeOrm:
                template = {
                    filename: `${names.kebab}.entity.ts`,
                    template: "nest/entity-typeorm.ejs",
                    mode: Mode.Write
                }
                break;
            case NestORMRule.Sequelize:
                template = {
                    filename: `${names.kebab}.entity.ts`,
                    template: "nest/entity-sequelize.ejs",
                    mode: Mode.Write
                }
                break;
            case NestORMRule.Prisma:
                template = {
                    filename: "schema.prisma",
                    template: "nest/entity-prisma.ejs",
                    mode: Mode.Append
                }
                break;
            case NestORMRule.MikroOrm:
                template = {
                    filename: `${names.kebab}.entity.ts`,
                    template: "nest/entity-mikroorm.ejs",
                    mode: Mode.Write
                }
                break;
        }

        const file = new File(workdir.abspath, template.filename);
        file.touch();
        const contents = new Template(strings.TEMPLATE_PATH, template.template)
            .pass({ names, syntax, rules: ConfigManager.createRuleSet() }).render().lines();
        
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
                options: NestORMRule,
                base: ConfigManager.getConfigProfile().nest.defaultOrm,
                flags: ["--orm"]
            }))
            .addArgument(new Optional({
                name: "syntax",
                description: "The database syntax to use",
                options: NestDbSyntaxRule,
                base: ConfigManager.getConfigProfile().nest.defaultDbSyntax,
                flags: ["--syntax"]
            }))
            .setAction(this.action)
            .build();
    }
}