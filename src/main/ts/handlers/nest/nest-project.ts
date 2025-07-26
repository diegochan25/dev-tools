import { FileModifyTemplate, Mode, Primitive } from "@/types";
import { UI } from "@cli/ui";
import { abortable, throws, requires } from "@lib/decorators";
import path from "path";
import { Command } from "@cli/command";
import { Positional } from "@cli/positional";
import { Optional } from "@cli/optional";
import { capitalize, findVersion } from "@lib/util";
import { Subprocess } from "@system/subprocess";
import { Directory } from "@system/directory";
import { File } from "@system/file";
import { Template } from "@templates/template";
import { strings } from "@resources/strings";
import { CaseConverter } from "@lib/case-converter";
import { FileError } from "@/error/file-error";
import { JavaScriptPackageManagerRule } from "@/config/config-rules";
import { ConfigManager } from "@/config/config-manager";

export class NestProject {
    @abortable
    @requires("path", "package-manager")
    @throws(FileError)
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const inputpath = args.get("path") as string;
        const packageManager = args.get("package-manager") as JavaScriptPackageManagerRule;

        const workdir = new Directory(path.resolve(inputpath));

        if (!workdir.exists) workdir.makedirs();

        let name: string = path.basename(workdir.abspath);
        if (path.basename(workdir.abspath) !== path.basename(inputpath)) {
            name = await UI.ask("Enter a name for the project:");
        }

        if (workdir.files().includes("package.json") && !new File(workdir.abspath, "package.json").empty) {
            UI.warning("A project already exists in the specified directory '%s'. Aborting to prevent overwriting.", workdir.abspath)
                .exit(1);
        }

        let runtime: string = "";
        let pm: string = "";
        let install: string = "add";
        let installdev: string = "-D"
        let scripts: { [key: string]: string } = {
            test: "node --test",
            build: "tsc",
            dev: "tsx src/main.ts",
            start: "node dist/main.js"
        };

        let dependencies: string[] = [
            "@nestjs/core",
            "@nestjs/common",
            "@nestjs/platform-express",
            "reflect-metadata",
            "rxjs",
            "class-validator",
            "class-transformer"
        ];
        
        let devDependencies: string[] = [
            "@types/node",
            "typescript",
            "tsx"
        ];

        let rootFiles: FileModifyTemplate[] = [
            {
                filename: ".dockerignore",
                template: "nest/dockerignore.ejs",
                mode: Mode.Write
            },
            {
                filename: ".gitignore",
                template: "nest/gitignore.ejs",
                mode: Mode.Write
            }
        ];

        let srcFiles: FileModifyTemplate[] = [
            {
                filename: "app.controller.ts",
                template: "nest/controller.ejs",
                mode: Mode.Write
            },
            {
                filename: "app.service.ts",
                template: "nest/service.ejs",
                mode: Mode.Write
            },
            {
                filename: "app.module.ts",
                template: "nest/module.ejs",
                mode: Mode.Write
            },
            {
                filename: "main.ts",
                template: "nest/main.ejs",
                mode: Mode.Write
            }
        ];

        switch (packageManager) {
            case JavaScriptPackageManagerRule.Npm:
                runtime = "node";
                pm = (await findVersion("npm", import.meta.dirname)) ? "npm" : "npm.cmd";
                install = "install";
                rootFiles.push(
                    {
                        filename: "Dockerfile",
                        template: "nest/dockerfile-node.ejs",
                        mode: Mode.Write
                    },
                    {
                        filename: "tsconfig.json",
                        template: "nest/tsconfig-node.ejs",
                        mode: Mode.Write
                    }
                );
                break;
            case JavaScriptPackageManagerRule.Yarn:
                runtime = "node";
                pm = "yarn";
                rootFiles.push(
                    {
                        filename: "Dockerfile",
                        template: "nest/dockerfile-node.ejs",
                        mode: Mode.Write
                    },
                    {
                        filename: "tsconfig.json",
                        template: "nest/tsconfig-node.ejs",
                        mode: Mode.Write
                    }
                );
                break;
            case JavaScriptPackageManagerRule.Pnpm:
                runtime = "node";
                pm = "pnpm";
                rootFiles.push(
                    {
                        filename: "Dockerfile",
                        template: "nest/dockerfile-node.ejs",
                        mode: Mode.Write
                    },
                    {
                        filename: "tsconfig.json",
                        template: "nest/tsconfig-node.ejs",
                        mode: Mode.Write
                    }
                );
                break;
            case JavaScriptPackageManagerRule.Bun:
                runtime = "bun";
                pm = "bun";
                scripts = {
                    test: "bun test",
                    dev: "bun src/main.ts --watch",
                    start: "bun src/main.ts"
                };
                devDependencies = ["@types/node"];
                rootFiles.push(
                    {
                        filename: "Dockerfile",
                        template: "nest/dockerfile-bun.ejs",
                        mode: Mode.Write
                    },
                    {
                        filename: "tsconfig.json",
                        template: "nest/tsconfig-bun.ejs",
                        mode: Mode.Write
                    },
                    {
                        filename: "index.ts",
                        template: "",
                        mode: Mode.Remove
                    }
                );
                break;
        }

        const runtimev = await UI.showLoading(findVersion(runtime, import.meta.dirname), `Finding ${capitalize(runtime)}...`);
        if (!runtimev) UI.error(`${capitalize(runtime)} was not found on this system.`).exit(1);

        UI.info("%s version: %s", runtime, runtimev);

        if (pm !== "bun") {
            const pmv = await UI.showLoading(findVersion(pm, import.meta.dirname), `Finding ${pm}...`);
            if (!pmv) UI.error(`${pm} was not found on this system.`).exit(1);

            UI.info("%s version: %s", pm, pmv);
        }

        await UI.showLoading(
            new Subprocess([pm, "init", "-y"]).cwd(workdir.abspath).run(),
            "Initializing project..."
        );

        UI.success("Project initialized!");

        UI.echo("Modifying package.json...");

        const jsonFile = new File(workdir.abspath, "package.json");
        const packageJson = jsonFile.read().json();

        packageJson["name"] = name;
        packageJson["version"] ??= "1.0.0";
        packageJson["type"] = "module";
        delete packageJson["main"]
        packageJson["module"] = "src/main.ts";
        packageJson["scripts"] = scripts;

        jsonFile.writeJson(packageJson);

        UI.success("package.json modified!");

        await UI.showLoading(
            async () => {
                await new Subprocess([pm, install, ...dependencies]).cwd(workdir.abspath).run();
                await new Subprocess([pm, install, installdev, ...devDependencies]).cwd(workdir.abspath).run();
            },
            "Installing dependencies..."
        );

        UI.success("Dependencies installed!");

        UI.echo("Creating project files...");

        rootFiles.forEach((t) => {
            const file = new File(workdir.abspath, t.filename);
            file.touch();
            let contents: string[] = [];
            if (t.template) {
                contents = new Template(strings.TEMPLATE_PATH, t.template)
                    .pass({
                        names: CaseConverter.convert("app"),
                        useController: true,
                        useControllerPath: false,
                        useService: true,
                        rules: ConfigManager.createRuleSet()
                    })
                    .render()
                    .lines()
            }

            switch (t.mode) {
                case Mode.Append:
                    file.appendLines(contents);
                    break;
                case Mode.Create:
                case Mode.Write:
                    file.writeLines(contents);
                    break;
                case Mode.Remove:
                    file.rm();
                    break;
            }
        });

        const srcdir = new Directory(workdir.abspath, "src");

        if (!srcdir.exists) srcdir.makedirs();

        srcFiles.forEach((t) => {
            const file = new File(workdir.abspath, "src", t.filename);
            file.touch();
            file.writeLines(
                new Template(strings.TEMPLATE_PATH, t.template)
                    .pass({
                        names: CaseConverter.convert("app"),
                        useController: true,
                        useControllerPath: true,
                        useService: true,
                        rules: ConfigManager.createRuleSet()
                    })
                    .render()
                    .lines()
            );
        });

        UI.success("Project files created!");
        UI.success("Project '%s' successfully created at '%s'!", name, workdir.abspath);

    }

    public static get command(): Command {
        return Command.builder()
            .setName("project")
            .setHelp("Generate a new NestJS project")
            .addArgument(new Positional({
                name: "path",
                description: "The path where the project will be created.",
                index: 0
            }))
            .addArgument(new Optional({
                name: "package-manager",
                description: "The package manager that will be used when building and scaffolding the project.",
                options: JavaScriptPackageManagerRule,
                base: ConfigManager.getConfigProfile().javascript.defaultPackageManager,
                flags: ["--package-manager", "-pm"]
            }))
            .setAction(this.action)
            .build();
    }
}