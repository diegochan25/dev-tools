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
import { Primitive } from "@/types/primitive";
import { CaseMap } from "@/types/case-map";

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

    private renderModule(names: CaseMap, module: NestModuleDecorator): string[] {
        return new Template(path.join(this.templatepath, "nest/module-base.ejs"))
            .pass({
                names: names,
                data: module
            })
            .render()
            .lines();
    }

    @abortable
    @requires("path", "flat", "dry-run")
    public createController(args: Map<string, Primitive>) {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const dryRun = args.get("dry-run") as boolean;

        const [filename, dirname] = this.splitPath(fullpath, flat);

        const names = CaseConverter.convert(filename);
        const dir = new Directory(dirname);
        const basename = `${names.kebab}.controller.ts`;
        const modulename = `${names.pascal}Controller`;
        const controller = new File(path.join(dirname, basename));
        const module = dir.files().find((file) => file == (`${names.kebab}.module.ts`))
            ||
            dir.files().find((file) => file.endsWith(".module.ts"));

        if (dryRun) {
            UI.echo(UI.white("Dry run: nest controller"));
            let modify = [];
            if (module) modify.push(module);
            this.showPreview(dirname, {
                modify: modify,
                create: [basename],
                remove: []
            })
            return;
        }

        if (controller.exists && !controller.empty) {
            UI.echo(UI.yellow(`File '${controller.basename}' already exists and is not empty. Aborting to avoid overwriting.`));
            return;
        }

        if (!dir.exists) dir.makedirs();
        if (!controller.exists) controller.touch();

        const contents = new Template(path.join(this.templatepath, "nest/controller.ejs"))
            .pass({
                names: names,
                useService: dir.files().includes(`${names.kebab}.service.ts`),
                useControllerPath: true
            })
            .render()
            .lines()
        controller.writeLines(contents);

        if (module) {
            UI.echo(
                UI.white("Attaching ") +
                UI.cyan(modulename) +
                UI.white(" to module at ") +
                UI.cyan(module) +
                UI.white("...")
            )
            const moduleData = this.scanModule(
                new File(path.resolve(path.join(dirname, module)))
                    .read()
                    .lines()
            );

            if (!moduleData.controllers.find((c) => c === modulename)) {
                moduleData.moduleImports.push(`import { ${modulename} } from "./${names.kebab}.controller";`)
                moduleData.controllers.push(modulename);
            }
            new File(path.join(dirname, module)).writeLines(
                this.renderModule(names, moduleData)
            );
        } else {
            UI.echo(UI.yellow(`No module was found in the directory '${dir.abspath}'. Consider creating a module before implementing '${names.pascal}Controller'.`));

        }

        UI.echo(UI.green("Controller '" + basename + "' was successfully created."))
    }

    @abortable
    @requires("path", "flat", "dry-run")
    public createService(args: Map<string, Primitive>) {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const dryRun = args.get("dry-run") as boolean;

        const [filename, dirname] = this.splitPath(fullpath, flat);

        const names = CaseConverter.convert(filename);
        const dir = new Directory(dirname);
        const basename = `${names.kebab}.service.ts`;
        const modulename = `${names.pascal}Service`;
        const service = new File(path.join(dirname, basename));
        const module = dir.files().find((file) => file == (`${names.kebab}.module.ts`))
            ||
            dir.files().find((file) => file.endsWith(".module.ts"));

        if (dryRun) {
            UI.echo(UI.white("Dry run: nest service"));
            let modify = [];
            if (module) modify.push(module);
            this.showPreview(dirname, {
                modify: modify,
                create: [basename],
                remove: []
            })
            return;
        }

        if (service.exists && !service.empty) {
            UI.echo(UI.yellow(`File '${service.basename}' already exists and is not empty. Aborting to avoid overwriting.`));
            return
        }

        if (!dir.exists) dir.makedirs();
        if (!service.exists) service.touch();

        const contents = new Template(path.join(this.templatepath, "nest/service.ejs"))
            .pass({
                names: names
            })
            .render()
            .lines()

        service.writeLines(contents);

        if (module) {
            UI.echo(
                UI.white("Attaching ") +
                UI.cyan(modulename) +
                UI.white(" to module at ") +
                UI.cyan(module) +
                UI.white("...")
            )
            const moduleData = this.scanModule(
                new File(path.resolve(path.join(dirname, module)))
                    .read()
                    .lines()
            );

            if (!moduleData.providers.find((c) => c === modulename)) {
                moduleData.moduleImports.push(`import { ${modulename} } from "./${names.kebab}.service";`)
                moduleData.providers.push(modulename);
            }
            new File(path.join(dirname, module)).writeLines(
                this.renderModule(names, moduleData)
            );
        } else {
            UI.echo(UI.yellow(`No module was found in the directory '${dir.abspath}'. Consider creating a module before implementing '${names.pascal}Controller'.`));

        }

        UI.echo(UI.green("Service '" + basename + "' was successfully created."))
    }

    @abortable
    @requires("path", "flat", "dry-run")
    public createModule(args: Map<string, Primitive>) {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const dryRun = args.get("dry-run") as boolean;

        const [filename, dirname] = this.splitPath(fullpath, flat);

        const names = CaseConverter.convert(filename);
        const dir = new Directory(dirname);
        const basename = `${names.kebab}.module.ts`;
        const module = new File(path.join(dirname, basename));

        if (dryRun) {
            UI.echo(UI.white("Dry run: nest module"));

            this.showPreview(dirname, {
                modify: [],
                create: [basename],
                remove: []
            })
            return;
        }

        if (module.exists && !module.empty) {
            UI.echo(UI.yellow(`File '${module.basename}' already exists and is not empty. Aborting to avoid overwriting.`));
            return
        }

        if (!dir.exists) dir.makedirs();
        if (!module.exists) module.touch();

        const contents = new Template(path.join(this.templatepath, "nest/module.ejs"))
            .pass({
                names: names,
                useController: dir.files().includes(`${names.kebab}.controller.ts`),
                useService: dir.files().includes(`${names.kebab}.service.ts`),
            })
            .render()
            .lines()

        module.writeLines(contents);

        UI.echo(UI.green("Module '" + basename + "' was successfully created."));
    }

    @abortable
    @requires("path", "flat", "orm", "dry-run")
    public createEntity(args: Map<string, Primitive>): void {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const orm = args.get("orm") as string;
        const dryRun = args.get("dry-run") as boolean;

        const [filename, dirname] = this.splitPath(fullpath, flat);

        const names = CaseConverter.convert(filename);
        const dir = new Directory(dirname);
        const basename = `${names.kebab}.entity.ts`;
        const entity = new File(path.join(dirname, orm === "prisma" ? "schema.prisma" : basename));

        if (dryRun) {
            UI.echo(UI.white("Dry run: nest entity"));
            let modify = [];
            let create = [];
            if (dir.files().includes("schema.prisma")) {
                modify.push("schema.prisma");
            } else {
                create.push("schema.prisma");
            }
            if (orm === "prisma") {
                this.showPreview(dirname, {
                    modify: modify,
                    create: create,
                    remove: []
                })
            } else {
                this.showPreview(dirname, {
                    modify: [],
                    create: [basename],
                    remove: []
                })
            }
            return;
        }

        if (entity.exists && !entity.empty) {
            UI.echo(UI.yellow(`File '${entity.basename}' already exists and is not empty. Aborting to avoid overwriting.`));
            return
        }

        if (!dir.exists) dir.makedirs();
        if (!entity.exists) entity.touch();

        let template: string = "";

        switch (orm) {
            case "typeorm":
                template = "nest/entity-typeorm.ejs";
                break;
            case "sequelize":
                template = "nest/entity-sequelize.ejs";
                break;
            case "prisma":
                template = "nest/entity-prisma.ejs";
                break;
            case "mikroorm":
                template = "nest/entity-mikroorm.ejs";
                break;
        }

        const contents = new Template(path.join(this.templatepath, template))
            .pass({
                names: names
            })
            .render()
            .lines()

        if (orm === "prisma") {
            entity.appendLines(contents);
            UI.echo(UI.green("File 'schema.prisma' was successfully updated with model '" + names.pascal + "'."));
        } else {
            entity.writeLines(contents);
            UI.echo(UI.green("Module '" + basename + "' was successfully created."));
        }
    }

    @abortable
    @requires("path", "flat", "runtime")
    public async createProject(args: Map<string, Primitive>): Promise<void> {
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

        UI.echo(UI.green("Files created!"));

        UI.echo(UI.green("Project '" + filename + "' was successfully created."));
    }
}
