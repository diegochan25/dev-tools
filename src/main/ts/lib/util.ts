import { UI } from "@cli/ui"
import { CaseMap, NestModuleDecorator } from "@/types";
import { Subprocess } from "@system/subprocess"
import { strings } from "@resources/strings";
import { Template } from "@templates/template";
import { Directory } from "@system/directory";
import path from "path";
import { ConfigManager } from "@/config/config-manager";

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

export const findPackageJson = (start: string): string => {
    const visited = new Set<string>();

    const searchTree = (dirpath: string): string => {
        const dir = new Directory(dirpath);
        visited.add(path.resolve(dirpath));

        for (const file of dir.files()) {
            if (path.basename(file) === "package.json") {
                return path.resolve(file);
            }
        }

        for (const subdir of dir.dirs()) {
            const resolved = path.resolve(subdir);
            if (!visited.has(resolved)) {
                const found = searchTree(resolved);
                if (found) return found;
            }
        }

        return "";
    };

    let current = path.resolve(start);

    while (true) {
        const result = searchTree(current);
        if (result) return result;

        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;
    }

    return "";
};

export const addModuleExports = (contents: string[], exports: string[]): string[] => {
    const { indent, semicolon } = ConfigManager.createRuleSet().javascript;

    let start = -1;
    let end = -1;

    contents.forEach((line, index) => {
        if (line.trim().startsWith("module.exports")) {
            start = index;
        }

        if (start !== -1 && end === -1 && line.trim() === "}") {
            end = index;
        }
    });

    if (start === -1) {
        return [...contents, "", "module.exports = {", ...exports.map((e) => indent + e + semicolon), "}" + semicolon];
    }

    const before = contents.slice(0, end);
    const after = contents.slice(end);

    const existing = new Set<string>(
        contents.slice(start + 1, end).map(line => line.trim().replace(semicolon, ""))
    );
    const additions = exports.filter(e => !existing.has(e));

    return [
        ...before,
        ...additions.map((e) => indent + e + semicolon),
        ...after
    ];
};


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
    return new Template(strings.TEMPLATE_PATH, "nest/module-base.ejs")
        .pass({
            names: names,
            data: module
        })
        .render()
        .lines();
}

export const getNestedProperty = (obj: any, keys: string[]): any => {
    for (const key of keys) {
        obj = (obj && typeof obj === "object" && key in obj) ? obj[key] : undefined;
    }
    return obj;
}

export const setNestedProperty = (obj: any, keys: string[], value: any): void => {
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
            current[key] = {};
        }
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
};
