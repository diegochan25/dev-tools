import path from "path";
import { Command } from "@cli/command";
import { Optional } from "@cli/optional";
import { Positional } from "@cli/positional";
import { UI } from "@cli/ui";
import { FileError } from "@error/file-error";
import { CaseConverter } from "@lib/case-converter";
import { templatepath } from "@lib/consts";
import { abortable, requires, throws } from "@lib/decorators";
import { Directory } from "@system/directory";
import { File } from "@system/file";
import { Template } from "@templates/template";
import { FileModifyTemplate, Mode, Primitive, ReactSyntax } from "@/types";

export class ReactView {
    @abortable
    @requires("path", "lang")
    @throws(FileError)
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const inputpath = args.get("path") as string;
        const lang = args.get("lang") as ReactSyntax;
        const workdir = new Directory(path.resolve(inputpath));

        if (!workdir.exists) workdir.makedirs();

        let name: string = path.basename(workdir.abspath);
        if (path.basename(workdir.abspath) !== path.basename(inputpath)) {
            name = await UI.ask("Enter a name for the view:");
        }

        const names = CaseConverter.convert(name);

        const template: FileModifyTemplate = {
            filename: `page.${lang}`,
            template: "react/view.ejs",
            mode: Mode.Write
        }



        const file = new File(workdir.abspath, template.filename);
        file.touch();
        const contents = new Template(templatepath, template.template)
            .pass({
                names: names,
                useTypescript: lang === ReactSyntax.TSX,
                useStyles: true
            })
            .render()
            .lines()

        file.writeLines(contents);

        UI.success("View '%s' has been created!", name).exit(0);
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
                options: ReactSyntax,
                base: ReactSyntax.JSX,
                flags: ["--lang"]
            }))
            .setAction(this.action)
            .build();
    }
}