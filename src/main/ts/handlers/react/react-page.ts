import path from "path";
import { Command } from "@cli/command";
import { Optional } from "@cli/optional";
import { Positional } from "@cli/positional";
import { UI } from "@cli/ui";
import { FileError } from "@error/file-error";
import { CaseConverter } from "@lib/case-converter";
import { strings } from "@resources/strings";
import { abortable, requires, throws } from "@lib/decorators";
import { Directory } from "@system/directory";
import { File } from "@system/file";
import { Template } from "@templates/template";
import { FileModifyTemplate, Mode, Primitive } from "@/types";
import { ReactLanguageRule } from "@/config/config-rules";
import { ConfigManager } from "@/config/config-manager";

export class ReactPage {
    @abortable
    @requires("path", "lang")
    @throws(FileError)
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const inputpath = args.get("path") as string;
        const lang = args.get("lang") as ReactLanguageRule;
        const workdir = new Directory(path.resolve(inputpath));

        if (!workdir.exists) workdir.makedirs();

        let name: string = path.basename(workdir.abspath);
        if (path.basename(workdir.abspath) !== path.basename(inputpath)) {
            name = await UI.ask("Enter a name for the page route:");
        }

        const names = CaseConverter.convert(name);

        const templates: FileModifyTemplate[] = [
            {
                filename: `layout.${lang}`,
                template: "react/layout.ejs",
                mode: Mode.Write
            },
            {
                filename: `page.${lang}`,
                template: "react/view.ejs",
                mode: Mode.Write
            },
            {
                filename: `${names.kebab}.module.css`,
                template: "react/css-module.ejs",
                mode: Mode.Write
            }
        ];

        templates.forEach((t) => {
            const file = new File(workdir.abspath, t.filename);
            if (file.exists && !file.empty) {
                UI.warning("Directory for page '%s' already exists and contains non-empty files. Aborting to avoid overwriting.", name)
                    .exit(1);
            }
            file.touch();
            const contents = new Template(strings.TEMPLATE_PATH, t.template)
                .pass({
                    names: names,
                    useTypescript: lang === ReactLanguageRule.TSX,
                    useStyles: true,
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

        UI.success("Page '%s' has been created with files '%s'!", name, templates.map((t) => t.filename).join("', '")).exit(0);
    }

    public static get command(): Command {
        return Command.builder()
            .setName("page")
            .setHelp("Create a full Next.js page route")
            .addArgument(new Positional({
                name: "path",
                description: "The path where the Next.js page will be created.",
                index: 0
            }))
            .addArgument(new Optional({
                name: "lang",
                description: "Choose whether to use JSX with JavaScript or TypeScript syntax",
                options: ReactLanguageRule,
                base: ConfigManager.getConfigProfile().react.defaultLang,
                flags: ["--lang"]
            }))
            .setAction(this.action) 
            .build();
    }
}