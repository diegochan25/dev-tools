import path from "path"
import { abortable, requires } from "@/lib/decorators";
import { HandlerBase } from "./handler-base";
import { UI } from "@cli/ui";
import { Subprocess } from "@lib/subprocess";
import { File } from "@lib/file";
import { Directory } from "@lib/directory";
import { Template } from "@templates/template";
import { CaseConverter } from "@lib/case-converter";
import { NestModuleDecorator } from "@/types/nest-module-decorator";

export class NestHandler extends HandlerBase {

    private scanModule(lines: string[]): NestModuleDecorator {
        const module: NestModuleDecorator = {
            imports: [],
            controllers: [],
            providers: [],
            exports: []
        };

        const keys = ["imports", "controllers", "providers", "exports"] as Array<keyof NestModuleDecorator>;

        lines.forEach((line) => {
            keys.forEach((attr) => {
                const trimmed = line.trim();
                if (trimmed.startsWith(attr)) {
                    const start = trimmed.indexOf("[");
                    const end = trimmed.indexOf("]", start);
                    if (start !== -1 && end !== -1) {
                        const items = trimmed
                            .slice(start + 1, end)
                            .split(",")
                            .map(i => i.trim())
                            .filter(i => i.length > 0);
                        module[attr] = items;
                    }
                }
            });
        });

        return module;
    }


    @abortable
    @requires("path")
    @requires("flat")
    @requires("runtime")
    public async createProject(args: Map<string, any>): Promise<void> {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const runtime = args.get("runtime") as string;

        const [filename, dirname] = this.splitPath(fullpath, flat);

        const rootdir = new Directory(dirname);
        if (!rootdir.exists) rootdir.makedirs();

        let pm: string = "";

        switch (runtime) {
            case "node":
                const nodeVersion = await this.findVersion("node", "Finding node...");

                if (nodeVersion) {
                    UI.echo(UI.white("Node version: ") + UI.cyan(nodeVersion));
                } else {
                    UI.echo(UI.red("Node.js was not found on this system."));
                    return;
                }

                let npmVersion = await this.findVersion("npm", "Finding npm...");
                if (npmVersion) {
                    UI.echo(UI.white("npm version: ") + UI.cyan(npmVersion));
                    pm = "npm";
                } else {
                    npmVersion = await this.findVersion("npm.cmd");
                    if (npmVersion) {
                        UI.echo(UI.white("npm version: ") + UI.cyan(npmVersion));
                        pm = "npm.cmd";
                    } else {
                        UI.echo(UI.red("npm was not found on this system."));
                        return;
                    }
                }
                await UI.showLoading(
                    new Subprocess([pm, "init", "-y"])
                        .cwd(dirname)
                        .run(),
                    "Creating empty project..."
                )

                UI.echo(UI.green("Created empty project!"));

                UI.echo(UI.white("Modifying package.json..."));

                const nodePkgJson: File = new File(path.join(dirname, "package.json")).read();

                const nodePkgObj = nodePkgJson.json();

                nodePkgObj["main"] = "src/main.ts";
                nodePkgObj["type"] = "module"
                nodePkgObj["scripts"] = {};
                nodePkgObj["scripts"]["test"] = "echo \"Error: no test specified\" && exit 1"
                nodePkgObj["scripts"]["start"] = "tsx src/main.ts";
                nodePkgObj["scripts"]["dev"] = "tsx watch src/main.ts";

                nodePkgJson.writeJson(nodePkgObj);

                UI.echo(UI.green("package.json modified!"));

                await UI.showLoading(
                    new Subprocess([
                        pm,
                        "install",
                        "@nestjs/core",
                        "@nestjs/common",
                        "@nestjs/platform-express",
                        "reflect-metadata",
                        "rxjs",
                    ]).cwd(dirname)
                        .run(),
                    "Installing dependencies..."
                );

                await UI.showLoading(
                    new Subprocess([
                        pm,
                        "install",
                        "-D",
                        "typescript",
                        "tsx",
                        "@types/node"
                    ]).cwd(dirname)
                        .run()
                );

                UI.echo(UI.green("Dependencies installed!"));
                break;
            case "bun":
                const bunVersion = await this.findVersion("bun", "Finding Bun...");
                if (bunVersion) {
                    UI.echo(UI.white("Bun version:") + UI.cyan(bunVersion));
                } else {
                    UI.echo(UI.red("Bun was not found on this system."));
                    return;
                }

                await UI.showLoading(
                    new Subprocess(["bun", "init", "-y"])
                        .cwd(dirname)
                        .run(),
                    "Creating empty project..."
                );


                UI.echo(UI.green("Created empty project!"));

                UI.echo(UI.white("Modifying package.json..."));

                const bunPkgJson: File = new File(path.join(dirname, "package.json")).read();

                const bunPkgObj = bunPkgJson.json();

                delete bunPkgObj["main"];

                bunPkgObj["module"] = "src/main.ts";
                bunPkgObj["type"] = "module";
                bunPkgObj["scripts"] = {};  
                bunPkgObj["scripts"]["test"] = "echo \"Error: no test specified\" && exit 1"
                bunPkgObj["scripts"]["dev"] = "bun --watch src/main.ts";
                bunPkgObj["scripts"]["start"] = "bun src/main.ts";

                bunPkgJson.writeJson(bunPkgObj);

                UI.echo(UI.green("package.json modified!"));

                await UI.showLoading(
                    new Subprocess([
                        "bun",
                        "add",
                        "@nestjs/core",
                        "@nestjs/common",
                        "@nestjs/platform-express",
                        "reflect-metadata",
                        "rxjs",
                    ]).cwd(dirname)
                        .run(),
                    "Installing dependencies..."
                );

                await UI.showLoading(
                    new Subprocess([
                        "bun",
                        "add",
                        "@types/node"
                    ]).cwd(dirname)
                        .run()
                );

                UI.echo(UI.green("Dependencies installed!"));

                break;
        }

        const rootTemplates = [
            { name: "Dockerfile", template: "nest/dockerfile-node.ejs" },
            { name: ".dockerignore", template: "nest/dockerignore.ejs" },
            { name: ".gitignore", template: "nest/gitignore.ejs" },
            { name: "tsconfig.json", template: "nest/tsconfig-node.ejs" },
        ];

        const srcTemplates = [
            { name: "app.module.ts", template: "nest/module.ejs" },
            { name: "app.controller.ts", template: "nest/controller.ejs" },
            { name: "app.service.ts", template: "nest/service.ejs" },
            { name: "main.ts", template: "nest/main.ejs" }
        ];

        UI.echo(UI.white("Scaffolding files..."));

        rootTemplates.forEach((file) => {
            const content: string[] = new Template(path.join(this.templatepath, file.template))
                .pass({
                    names: new CaseConverter(filename).convert(),
                    useController: true,
                    useService: true
                })
                .render()
                .lines();

            new File(path.join(dirname, file.name))
                .touch()
                .writeLines(content);
        });

        srcTemplates.forEach((file) => {
            const content: string[] = new Template(path.join(this.templatepath, file.template))
                .pass({
                    names: new CaseConverter("app").convert(),
                    useController: true,
                    useService: true
                })
                .render()
                .lines();

            new File(path.join(dirname, "src", file.name))
                .ensure()
                .writeLines(content);
        });

        UI.echo(UI.green("Files created!"));

        UI.echo(UI.cyan("Project '" + filename + "' was successfully created."));
    }
}
