import { Primitive } from "@type/primitive";
import { HandlerBase } from "./handler-base";
import { abortable, requires } from "@lib/decorators";
import { FileModifyTemplate } from "@type/file-create-template";
import { CaseConverter } from "@lib/case-converter";
import { Mode } from "@/types/mode";
import { Directory } from "@/lib/directory";
import { FileModifyResults } from "@/types/file-modify-results";
import { UI } from "@/cli/ui";

export class Test extends HandlerBase {
    @abortable
    @requires("path", "flat", "dry-run")
    public createModule(args: Map<string, Primitive>): void {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const dryRun = args.get("dry-run") as boolean;

        const [dirname, filename] = this.splitPath(fullpath, flat);
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
            UI.echo(UI.green("Resource '" + filename + "' was successfully created with files '" + files.map((f) => f.filename).join("', '") + "'."));
        } else {
            UI.echo(UI.red("There was a problem creating module '" + names.pascal + "Module'. The following files were not properly modified: "));
            UI.echo(UI.red(failures.reduce((acc, f) => acc + "   " + f.filename + "\n", "")));
        }
    }

    @abortable
    @requires("path", "flat", "dry-run")
    public createController(args: Map<string, Primitive>): void {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const dryRun = args.get("dry-run") as boolean;

        const [dirname, filename] = this.splitPath(fullpath, flat);
        const names = CaseConverter.convert(filename);

        const files: FileModifyTemplate[] = [
            { filename: `${names.kebab}.controller.ts`, template: "nest/controller.ejs", mode: Mode.Write }
        ];

        const workdir = new Directory(dirname);

        if (dryRun) {
            this.dryRun(workdir, files);
            return;
        }

        const results: FileModifyResults[] = this.writeFiles(workdir, files, {
            names: names,
            useService: workdir.files().includes(`${names.kebab}.service.ts`),
        });
    }

    @abortable
    @requires("path", "flat", "dry-run")
    public createService(args: Map<string, Primitive>): void {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const dryRun = args.get("dry-run") as boolean;

        const [dirname, filename] = this.splitPath(fullpath, flat);
        const names = CaseConverter.convert(filename);

        const files: FileModifyTemplate[] = [
            { filename: `${names.kebab}.service.ts`, template: "nest/service.ejs", mode: Mode.Write }
        ];

        const workdir = new Directory(dirname);

        if (dryRun) {
            this.dryRun(workdir, files);
            return;
        }

        const results: FileModifyResults[] = this.writeFiles(workdir, files, {
            names: names,
            useService: workdir.files().includes(`${names.kebab}.service.ts`),
        });
    }

    @abortable
    @requires("path", "flat", "dry-run", "orm")
    public createEntity(args: Map<string, Primitive>): void {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const dryRun = args.get("dry-run") as boolean;
        const orm = args.get("orm") as string;

        const [dirname, filename] = this.splitPath(fullpath, flat);
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
            UI.echo(UI.green("Resource '" + filename + "' was successfully created with files '" + files.map((f) => f.filename).join("', '") + "'."));
        } else {
            UI.echo(UI.red("There was a problem creating entity '" + names.pascal + "'. The following files were not properly modified: "));
            UI.echo(UI.red(failures.reduce((acc, f) => acc + "   " + f.filename + "\n", "")));
        }
    }

    @abortable
    @requires("path", "flat", "dry-run")
    public createResource(args: Map<string, Primitive>): void {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const dryRun = args.get("dry-run") as boolean;

        const [dirname, filename] = this.splitPath(fullpath, flat);
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
            UI.echo(UI.green("Resource '" + filename + "' was successfully created with files '" + files.map((f) => f.filename).join("', '") + "'."));
        } else {
            UI.echo(UI.red("There was a problem creating resource '" + filename + "'. The following files were not properly modified: "));
            UI.echo(UI.red(failures.reduce((acc, f) => acc + "   " + f.filename + "\n", "")));
        }
    }

    @abortable
    @requires("path", "flat", "dry-run", "runtime")
    public createProject(args: Map<string, Primitive>): void {
        const fullpath = args.get("path") as string;
        const flat = args.get("flat") as boolean;
        const dryRun = args.get("dry-run") as boolean;
        const runtime = args.get("runtime") as string;
    }
}