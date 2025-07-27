import path from "path";
import { JavaScriptModuleSystemRule, NestDbSyntaxRule, NestORMRule } from "@config/config-rules";
import { FileError } from "@error/file-error";
import { File } from "@system/file";
import { Directory } from "@system/directory";
import { FileModifyTemplate, Mode, Primitive } from "@/types";
import { abortable, requires, throws } from "@lib/decorators";
import { UI } from "@cli/ui";
import { CaseConverter } from "@lib/case-converter";
import { ConfigManager } from "@config/config-manager";
import { strings } from "@resources/strings";
import { Template } from "@templates/template";
import { Command } from "@cli/command";
import { Positional } from "@cli/positional";
import { Optional } from "@cli/optional";
import { addModuleExports, findPackageJson, readModule, renderModule } from "@lib/util";


export class NestRepository {
    @abortable
    @requires("path", "orm", "syntax", "data-source")
    @throws(FileError)
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const inputpath = args.get("path") as string;
        const orm = args.get("orm") as NestORMRule;
        const syntax = args.get("syntax") as NestDbSyntaxRule;
        const dataSource = args.get("data-source") as string;
        const workdir = new Directory(path.resolve(inputpath));

        if (orm === NestORMRule.Sequelize && syntax === NestDbSyntaxRule.MongoDB) {
            UI.error("ORM 'Sequelize' does not support MongoDB syntax.").exit(1);
        }

        if (!workdir.exists) workdir.makedirs();

        let name: string = path.basename(workdir.abspath);
        if (path.basename(workdir.abspath) !== path.basename(inputpath)) {
            name = await UI.ask("Enter a name for the repository:");
        }

        const names = CaseConverter.convert(name);

        const entity = new File(workdir.abspath, `${names.kebab}.entity.ts`);

        if (!entity.exists) {
            UI.error("No file named '%s' with an exported entity '%s' exists in this path.", `${names.kebab}.entity`, names.pascal)
                .exit(1);
        }

        let template = {} as FileModifyTemplate;

        switch (orm) {
            case NestORMRule.TypeOrm:
                template = {
                    filename: `${names.kebab}.repository.ts`,
                    template: "nest/repository-typeorm.ejs",
                    mode: Mode.Write
                }
                break;
            case NestORMRule.Sequelize:
                UI.warning("Action not implemented.").exit(1);
                break;
            case NestORMRule.Prisma:
                UI.warning("Action not implemented.").exit(1);
                break;
            case NestORMRule.MikroOrm:
                UI.warning("Action not implemented.").exit(1);
                break;
        }

        const file = new File(workdir.abspath, template.filename);

        if (file.exists && !file.empty) {
            UI.error("File '%s' already exists and is not empty. Aborting to avoid overwriting", file.abspath)
                .exit(1);
        }

        file.touch();

        const rules = ConfigManager.createRuleSet();

        const contents = new Template(strings.TEMPLATE_PATH, template.template)
            .pass({
                names,
                syntax,
                rules,
                dataSource
            })
            .render()
            .lines();

        if (template.mode === Mode.Write) {
            file.writeLines(contents);
        } else if (template.mode === Mode.Append) {
            file.appendLines(contents);
        }

        const rootdir = new Directory(path.dirname(findPackageJson(workdir.abspath)));
        const constants = new File(rootdir.abspath, "src", "common", "constants.ts");
        constants.ensure();

        let magicString: string;
        let dataSourceMagicString: string;

        const dataSourceNames = CaseConverter.convert(dataSource);

        const configProfile = ConfigManager.getConfigProfile();
        const moduleSyntax = configProfile.javascript.defaultModuleSyntax;

        switch (moduleSyntax) {
            case JavaScriptModuleSystemRule.CommonJS:
                magicString = `const ${names.upper}_REPOSITORY: string = ${rules.javascript.quote}${names.snake}_repository${rules.javascript.quote}${rules.javascript.semicolon}`;
                dataSourceMagicString = `const ${dataSourceNames.upper}: string = ${rules.javascript.quote}${names.snake}${rules.javascript.quote}${rules.javascript.semicolon}`;
                break;
            case JavaScriptModuleSystemRule.ES6:
                magicString = `export const ${names.upper}_REPOSITORY: string = ${rules.javascript.quote}${names.snake}_repository${rules.javascript.quote}${rules.javascript.semicolon}`
                dataSourceMagicString = `export const ${dataSourceNames.upper}: string = ${rules.javascript.quote}${dataSourceNames.snake}${rules.javascript.quote}${rules.javascript.semicolon}`;
                break;
        }

        const declaredMagicStrings = constants.read().lines().map((l) => l.trim());

        if (!declaredMagicStrings.includes(magicString)) {
            constants.append(magicString);
        }

        if (!declaredMagicStrings.includes(dataSourceMagicString)) {
            constants.append(dataSourceMagicString);
        }

        if (moduleSyntax === JavaScriptModuleSystemRule.CommonJS) {
            constants.appendLines(["\n", ...addModuleExports(contents, [moduleSyntax, magicString])]);
        }

        const modulepath: string =
            workdir.files().find((f) => f === `${names.kebab}.module.ts`)
            ||
            workdir.files().find((f) => f.endsWith(".module.ts"))
            ||
            "";

        if (modulepath) {
            const lines = new File(workdir.abspath, modulepath).read().lines();
            const data = readModule(lines);
            if (!data.providers.includes(`${names.camel}Repository`)) {
                data.moduleImports.push(
                    ConfigManager
                        .createRuleSet()
                        .javascript
                        .moduleImporter([`${names.camel}Repository`], `./${names.kebab}.repository`, false)
                );
                data.providers.push(`${names.camel}Repository`)
            }
            const module = renderModule(names, data);

            new File(workdir.abspath, modulepath).writeLines(module);
        } else {
            UI.warning(
                "No module found on directory '%s'. Consider adding a module before implementing '%sRepository'",
                workdir.abspath,
                names.camel
            );
        }

        UI.success("Repository '%s' successfully created at '%s'!", names.pascal, workdir.abspath).exit(0);

    }

    public static get command(): Command {
        return Command.builder()
            .setName("repository")
            .setHelp("Create a new NestJS repository for the entity name provided.")
            .addArgument(new Positional({
                name: "path",
                description: "The path where the repository will be created.",
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
            .addArgument(new Optional({
                name: "data-source",
                description: "The name of the dataSource provider to inject when creating the repository",
                base: ConfigManager.getConfigProfile().nest.defaultDataSource,
                flags: ["--syntax"]
            }))
            .setAction(this.action)
            .build();
    }
}