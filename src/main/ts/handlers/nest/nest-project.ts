import { PackageManagers, Primitive } from "@/types";
import { UI } from "@cli/ui";
import { abortable, requires } from "@lib/decorators";
import path from "path";
import { Command } from "@cli/command";
import { Positional } from "@cli/positional";
import { Optional } from "@cli/optional";
import { capitalize, findVersion } from "@/lib/util";
import { Subprocess } from "@/system/subprocess";
import { Directory } from "@/system/directory";
import { File } from "@/system/file";

export class NestProject {
    @abortable
    @requires("path", "package-manager")
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const inputpath = args.get("path") as string;
        const packageManager = args.get("package-manager") as PackageManagers;

        const workdir = new Directory(path.resolve(inputpath));
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
            "rxjs"
        ];
        let devDependencies: string[] = [
            "@types/node",
            "typescript",
            "tsx"
        ]

        let rootFiles: string[] = [
            "nest/gitignore.ejs",
            "nest/dockerignore.ejs",
        ]

        let srcFiles: string[] = [
            "nest/controller.ejs",
            "nest/service.ejs",
            "nest/module.ejs",
            "nest/main.ejs"
        ]

        switch (packageManager) {
            case PackageManagers.npm:
                runtime = "node";
                pm = (await findVersion("npm", import.meta.dirname)) ? "npm" : "npm.cmd";
                install = "install";
                rootFiles.push("nest/dockerfile-node.ejs", "nest/tsconfig-node.ejs")
                break;
            case PackageManagers.yarn:
                runtime = "node";
                pm = "yarn";
                rootFiles.push("nest/dockerfile-node.ejs", "nest/tsconfig-node.ejs")
                break;
            case PackageManagers.pnpm:
                runtime = "node";
                pm = "pnpm";
                rootFiles.push("nest/dockerfile-node.ejs", "nest/tsconfig-node.ejs")
                break;
            case PackageManagers.bun:
                runtime = "bun";
                pm = "bun";
                scripts = {
                    test: "bun test",
                    dev: "bun src/main.ts --watch",
                    start: "bun src/main.ts"
                }
                devDependencies = ["@types/node"];
                rootFiles.push("nest/dockerfile-bun.ejs", "nest/tsconfig-bun.ejs")
                break;
        }

        const runtimev = await UI.showLoading(findVersion(runtime, import.meta.dirname), `Finding ${capitalize(runtime)}...`);
        if (!runtimev) UI.error(`${capitalize(runtime)} was not found on this system.`).exit(1);

        const pmv = await UI.showLoading(findVersion(pm, import.meta.dirname), `Finding ${pm}...`);
        if (!pmv) UI.error(`${pm} was not found on this system.`).exit(1);

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

        UI.success("package.json modified!");

        await UI.showLoading(
            async () => {
                await new Subprocess([pm, install, ...dependencies]).cwd(workdir.abspath).run();
                await new Subprocess([pm, install, installdev, ...devDependencies]).cwd(workdir.abspath).run();
            },
            "Installing dependencies..."
        );

        UI.success("Dependencies installed!");

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
                base: "npm",
                options: PackageManagers,
                flags: ["--package-manager", "-pm"]
            }))
            .setAction(this.action)
            .build();
    }
}