import path from "path"
import { abortable, requires } from "@/lib/decorators";
import { HandlerBase } from "./handler-base";
import { UI } from "@cli/ui";
import { Subprocess } from "@lib/subprocess";
import { File } from "@lib/file";
import { Directory } from "@lib/directory";
import { Template } from "@templates/template";
import { CaseConverter } from "@lib/case-converter";
import { NestModuleDecorator } from "@type/nest-module-decorator";
import { Primitive } from "@type/primitive";
import { FileModifyResults } from "@type/file-modify-results";
import { FileModifyTemplate } from "@type/file-create-template";
import { Mode } from "@/types/mode";

export class NestHandler extends HandlerBase {
    private scanModule(lines: string[]): NestModuleDecorator {
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
        });

        if (!module.moduleImports.find((i) => i.includes("Module"))) {
            module.moduleImports.unshift("import { Module } from \"@nestjs/common\";");
        }

        for (let item in module) {
            const i = item as keyof NestModuleDecorator
            module[i] = [...new Set(module[i])];
        }

        return module;
    }

    @abortable
    @requires("path", "flat", "dry-run")
    public createModule(args: Map<string, Primitive>): void {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const dryRun = args.get("dry-run") as boolean;

        const { dirname, filename } = this.splitPath(fullpath, flat);
        const names = CaseConverter.convert(filename);

        const files: FileModifyTemplate[] = [
            { filename: `${names.kebab}.module.ts`, template: "nest/module.ejs", mode: Mode.Write }
        ];

        const workdir = new Directory(dirname);

        if (dryRun) {
            this.dryRun(workdir, files);
            return;
        }

        const results: FileModifyResults[] = this.writeFiles(workdir, files, {
            names: names,
            useController: workdir.files().includes(`${names.kebab}.controller.ts`),
            useService: workdir.files().includes(`${names.kebab}.service.ts`),
        });

        const failures = results.filter((r) => !r.success);

        if (failures.length === 0) {
            UI.success("Module '" + filename + "' was successfully created.");
        } else {
            UI.error("There was a problem creating module '" + names.pascal + "Module'. The following files were not properly modified: ");
            UI.error(failures.reduce((acc, f) => acc + "   " + f.filename + "\n", ""));
        }
    }

    @abortable
    @requires("path", "flat", "dry-run")
    public createController(args: Map<string, Primitive>): void {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const dryRun = args.get("dry-run") as boolean;

        const { dirname, filename } = this.splitPath(fullpath, flat);
        const names = CaseConverter.convert(filename);

        const workdir = new Directory(dirname);

        const modulefile =
            workdir.files().find((f) => f === `${names.kebab}.module.ts`)
            ||
            workdir.files().find((f) => f.endsWith(".module.ts"));

        const files: FileModifyTemplate[] = [
            { filename: `${names.kebab}.controller.ts`, template: "nest/controller.ejs", mode: Mode.Write },
        ];

        let moduleData = {} as NestModuleDecorator

        if (modulefile) {
            files.push({
                filename: modulefile,
                template: "nest/module-base.ejs",
                mode: Mode.Write
            });

            moduleData = this.scanModule(
                new File(path.join(workdir.abspath, modulefile))
                    .read()
                    .lines()
            );
            moduleData.moduleImports.push(`import { ${names.pascal}Controller } from "./${names.kebab}.controller";`);
            moduleData.controllers.push(`${names.pascal}Controller`);
        } else {
            UI.warning("No module file was found in this directory. Consider registering the controller to a module.");
        }

        if (dryRun) {
            this.dryRun(workdir, files);
            return;
        }

        const results: FileModifyResults[] = this.writeFiles(workdir, files, {
            names: names,
            useControllerPath: true,
            useService: workdir.files().includes(`${names.kebab}.service.ts`),
            data: moduleData
        });

        const failures = results.filter((r) => !r.success);

        if (failures.length === 0) {
            UI.success("Controlleer '" + filename + "' was successfully created.");
        } else {
            UI.error("There was a problem creating resource '" + filename + "'. The following files were not properly modified: ");
            UI.error(failures.reduce((acc, f) => acc + "   " + f.filename + "\n", ""));
        }
    }

    @abortable
    @requires("path", "flat", "dry-run")
    public createService(args: Map<string, Primitive>): void {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const dryRun = args.get("dry-run") as boolean;

        const { dirname, filename } = this.splitPath(fullpath, flat);
        const names = CaseConverter.convert(filename);

        const workdir = new Directory(dirname);

        const modulefile =
            workdir.files().find((f) => f === `${names.kebab}.module.ts`)
            ||
            workdir.files().find((f) => f.endsWith(".module.ts"));

        const files: FileModifyTemplate[] = [
            { filename: `${names.kebab}.service.ts`, template: "nest/service.ejs", mode: Mode.Write }
        ];

        let moduleData = {} as NestModuleDecorator

        if (modulefile) {
            files.push({
                filename: modulefile,
                template: "nest/module-base.ejs",
                mode: Mode.Write
            });

            moduleData = this.scanModule(
                new File(path.join(workdir.abspath, modulefile))
                    .read()
                    .lines()
            );
            moduleData.moduleImports.push(`import { ${names.pascal}Service } from "./${names.kebab}.service";`);
            moduleData.providers.push(`${names.pascal}Service`);
        } else {
            UI.warning("No module file was found in this directory. Consider registering the controller to a module.");
        }

        if (dryRun) {
            this.dryRun(workdir, files);
            return;
        }

        const results: FileModifyResults[] = this.writeFiles(workdir, files, {
            names: names
        });

        const failures = results.filter((r) => !r.success);

        if (failures.length === 0) {
            UI.success("Service '" + filename + "' was successfully created.");
        } else {
            UI.error("There was a problem creating resource '" + filename + "'. The following files were not properly modified: ");
            UI.error(failures.reduce((acc, f) => acc + "   " + f.filename + "\n", ""));
        }
    }

    @abortable
    @requires("path", "flat", "dry-run", "orm")
    public createEntity(args: Map<string, Primitive>): void {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const dryRun = args.get("dry-run") as boolean;
        const orm = args.get("orm") as string;

        const { dirname, filename } = this.splitPath(fullpath, flat);
        const names = CaseConverter.convert(filename);
        const isPrisma: boolean = orm === "prisma";

        const files: FileModifyTemplate[] = [
            {
                filename: isPrisma ? "schema.prisma" : `${names.kebab}.entity.ts`,
                template: `nest/entity-${orm}.ejs`,
                mode: isPrisma ? Mode.Append : Mode.Write
            }
        ];

        const workdir = new Directory(dirname);

        if (dryRun) {
            this.dryRun(workdir, files);
            return;
        }

        const results: FileModifyResults[] = this.writeFiles(workdir, files, {
            names: names
        });

        const failures = results.filter((r) => !r.success);

        if (failures.length === 0) {
            UI.success("Entity '" + filename + "' was successfully created.");
        } else {
            UI.error("There was a problem creating entity '" + names.pascal + "'. The following files were not properly modified: ");
            UI.error(failures.reduce((acc, f) => acc + "   " + f.filename + "\n", ""));
        }
    }

    @abortable
    @requires("path", "flat", "dry-run")
    public createResource(args: Map<string, Primitive>): void {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const dryRun = args.get("dry-run") as boolean;

        const { dirname, filename } = this.splitPath(fullpath, flat);
        const names = CaseConverter.convert(filename);

        const files: FileModifyTemplate[] = [
            { filename: `${names.kebab}.module.ts`, template: "nest/module.ejs", mode: Mode.Write },
            { filename: `${names.kebab}.controller.ts`, template: "nest/controller.ejs", mode: Mode.Write },
            { filename: `${names.kebab}.service.ts`, template: "nest/service.ejs", mode: Mode.Write }
        ];

        const workdir = new Directory(dirname);

        if (dryRun) {
            this.dryRun(workdir, files);
            return;
        }

        const results: FileModifyResults[] = this.writeFiles(workdir, files, {
            names: names,
            useController: true,
            useService: true,
            useControllerPath: true
        });

        const failures = results.filter((r) => !r.success);

        if (failures.length === 0) {
            UI.success("Resource '" + filename + "' was successfully created with files '" + files.map((f) => f.filename).join("', '") + "'.");
        } else {
            UI.error("There was a problem creating resource '" + filename + "'. The following files were not properly modified: ");
            UI.error(failures.reduce((acc, f) => acc + "   " + f.filename + "\n", ""));
        }
    }

    @abortable
    @requires("path", "flat", "runtime")
    public async createProject(args: Map<string, Primitive>): Promise<void> {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const runtime = args.get("runtime") as string;

        const { dirname, filename } = this.splitPath(fullpath, flat);


        const rootdir = new Directory(dirname);
        if (!rootdir.exists) rootdir.makedirs();

        let pm: string = "";
        let rootTemplates: { name: string, template: string }[] = [];

        switch (runtime) {
            case "node":
                const nodeVersion = await this.findVersion("node", "Finding node...");

                if (nodeVersion) {
                    UI.echo("Node version: " + UI.cyan(nodeVersion));
                } else {
                    UI.error("Node.js was not found on this system.");
                    return;
                }

                let npmVersion = await this.findVersion("npm", "Finding npm...");
                if (npmVersion) {
                    UI.echo("npm version: " + UI.cyan(npmVersion));
                    pm = "npm";
                } else {
                    npmVersion = await this.findVersion("npm.cmd");
                    if (npmVersion) {
                        UI.echo("npm version: " + UI.cyan(npmVersion));
                        pm = "npm.cmd";
                    } else {
                        UI.error("npm was not found on this system.");
                        return;
                    }
                }
                await UI.showLoading(
                    new Subprocess([pm, "init", "-y"])
                        .cwd(dirname)
                        .run(),
                    "Creating empty project..."
                )

                UI.success("Created empty project!");

                UI.echo("Modifying package.json...");

                const nodePkgJson: File = new File(path.join(dirname, "package.json")).read();

                const nodePkgObj = nodePkgJson.json();

                nodePkgObj["main"] = "src/main.ts";
                nodePkgObj["type"] = "module"
                nodePkgObj["scripts"] = {};
                nodePkgObj["scripts"]["test"] = "echo \"Error: no test specified\" && exit 1"
                nodePkgObj["scripts"]["start"] = "tsx src/main.ts";
                nodePkgObj["scripts"]["dev"] = "tsx watch src/main.ts";

                nodePkgJson.writeJson(nodePkgObj);

                UI.success("package.json modified!");

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

                UI.success("Dependencies installed!");

                rootTemplates = [
                    { name: "Dockerfile", template: "nest/dockerfile-node.ejs" },
                    { name: ".dockerignore", template: "nest/dockerignore.ejs" },
                    { name: ".gitignore", template: "nest/gitignore.ejs" },
                    { name: "tsconfig.json", template: "nest/tsconfig-node.ejs" },
                ];
                break;
            case "bun":
                const bunVersion = await this.findVersion("bun", "Finding Bun...");
                if (bunVersion) {
                    UI.echo("Bun version:" + UI.cyan(bunVersion));
                } else {
                    UI.error("Bun was not found on this system.");
                    return;
                }

                await UI.showLoading(
                    new Subprocess(["bun", "init", "-y"])
                        .cwd(dirname)
                        .run(),
                    "Creating empty project..."
                );


                UI.success("Created empty project!");

                UI.echo("Modifying package.json...");

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

                UI.success("package.json modified!");

                new File(path.join(dirname, "index.ts")).rm();

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

                UI.success("Dependencies installed!");

                rootTemplates = [
                    { name: "Dockerfile", template: "nest/dockerfile-bun.ejs" },
                    { name: ".dockerignore", template: "nest/dockerignore.ejs" },
                    { name: ".gitignore", template: "nest/gitignore.ejs" },
                    { name: "tsconfig.json", template: "nest/tsconfig-bun.ejs" },
                ];
                break;
        }

        const srcTemplates = [
            { name: "app.module.ts", template: "nest/module.ejs" },
            { name: "app.controller.ts", template: "nest/controller.ejs" },
            { name: "app.service.ts", template: "nest/service.ejs" },
            { name: "main.ts", template: "nest/main.ejs" }
        ];

        UI.echo("Scaffolding files...");

        rootTemplates.forEach((file) => {
            const content: string[] = new Template(path.join(this.templatepath, file.template))
                .pass({
                    names: CaseConverter.convert(filename),
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
                    names: CaseConverter.convert("app"),
                    useController: true,
                    useControllerPath: false,
                    useService: true
                })
                .render()
                .lines();

            new File(path.join(dirname, "src", file.name))
                .ensure()
                .writeLines(content);
        });

        UI.success("Files created!");
        UI.success("Project '" + filename + "' was successfully created.");
    }
}