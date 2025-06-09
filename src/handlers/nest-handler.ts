import { abortable, requires } from "@/lib/decorators";
import { HandlerBase } from "./handler-base";
import { UI } from "@cli/ui";
import { Subprocess } from "@/lib/subprocess";
import path from "path"
import { File } from "@/lib/file";
import { Directory } from "@/lib/directory";
import { Template } from "@/templates/template";
import { CaseConverter } from "@/lib/case-converter";

export class NestHandler extends HandlerBase {

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
                try {
                    const nodeVersion = await UI.showLoading(
                        new Subprocess(["node", "--version"])
                            .cwd(dirname)
                            .run(),
                        "Finding node..."
                    );
                    if (nodeVersion.stdout()) UI.echo(UI.white(`Node version: ${nodeVersion.stdout()}`));
                } catch {
                    UI.echo(UI.red("Node.js was not found on this system."));
                }

                try {
                    const npmVersion = await UI.showLoading(
                        new Subprocess(["npm", "--version"])
                            .cwd(dirname)
                            .run(),
                        "Finding npm..."
                    );
                    if (npmVersion.stdout()) UI.echo(UI.cyan(`npm version: ${npmVersion.stdout()}`));
                    pm = "npm";
                } catch (error) {
                    try {
                        const npmCmdVersion = await UI.showLoading(
                            new Subprocess(["npm.cmd", "--version"])
                                .cwd(dirname)
                                .run()
                        );
                        if (npmCmdVersion.stdout()) UI.echo(UI.cyan(`npm version: ${npmCmdVersion.stdout()}`));
                        pm = "npm.cmd";
                    } catch {
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

                UI.echo(UI.white("Modifying package.json..."))

                const packageJson: File = new File(path.join(fullpath, "package.json")).read();

                const packageObject = packageJson.json();

                packageObject["main"] = "src/main.ts";
                packageObject["type"] = "module"
                packageObject["scripts"]["start"] = "tsx src/main.ts";
                packageObject["scripts"]["dev"] = "tsx watch src/main.ts";

                packageJson.writeJson(packageObject);

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

                break;
            case "bun":
                break;
        }
    }
}
