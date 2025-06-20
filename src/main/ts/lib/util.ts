import { UI } from "@cli/ui"
import { CaseMap, NestModuleDecorator } from "@/types";
import { Subprocess } from "@system/subprocess"
import { templatepath } from "./consts";
import { Template } from "@templates/template";

export const findVersion = async (cmd: string, cwd: string, message?: string): Promise<string> => {
    try {
        if (message) UI.echo(message);
        const cmdVersion = (await new Subprocess([
            cmd,
            "--version"
        ])
            .cwd(cwd)
            .run()
        ).stdout().trim();

        return cmdVersion;
    } catch {
        return "";
    }
}

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const readModule = (lines: string[]) => {
    const module: NestModuleDecorator = {
        moduleImports: [],
        imports: [],
        controllers: [],
        providers: [],
        exports: []
    };

    const itemize = (line: string) => line
        .slice(line.indexOf("[") + 1, line.indexOf("]"))
        .split(",")
        .map(i => i.trim())
        .filter(i => i !== "");

    lines.forEach((line) => {
        if (line.trim().startsWith("import ")) {
            module.moduleImports.push(line);
        } else if (line.trim().startsWith("imports")) {
            module.imports = itemize(line);
        } else if (line.trim().startsWith("controllers")) {
            module.controllers = itemize(line);
        } else if (line.trim().startsWith("providers")) {
            module.providers = itemize(line);
        } else if (line.trim().startsWith("exports")) {
            module.exports = itemize(line);
        }
    })

    if (!module.moduleImports.find((i) => i.includes("Module"))) {
        module.moduleImports.unshift("import { Module } from \"@nestjs/common\";");
    }

    for (let item in module) {
        const i = item as keyof NestModuleDecorator
        module[i] = [...new Set(module[i])];
    }

    return module;
}

export const renderModule = (names: CaseMap, module: NestModuleDecorator) => {
    for (const key in module) {
        const k = key as keyof NestModuleDecorator;
        module[k] = [...new Set(module[k])];
    }
    return new Template(templatepath, "nest/module-base.ejs")
        .pass({
            names: names,
            data: module
        })
        .render()
        .lines();
}