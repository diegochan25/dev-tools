import { Directory } from "@/lib/directory";
import { File } from "@/lib/file";
import { Template } from "@templates/template";
import { FileModifyTemplate } from "@type/file-create-template";
import { FileModifyPreview } from "@type/file-modify-preview";
import { UI } from "@cli/ui";
import { Subprocess } from "@lib/subprocess";
import path from "path";
import { Mode } from "@/types/mode";
import { FileModifyResults } from "@/types/file-modify-results";

export abstract class HandlerBase {
    protected get templatepath(): string {
        return path.resolve(path.join(import.meta.dirname, "..", "templates"));
    }

    protected splitPath(filepath: string, flat: boolean): {filename: string, dirname: string} {
        const filename = path.basename(filepath);
        const dirname = path.resolve((flat ? path.dirname(filepath) : filepath));
        return { filename: filename, dirname: dirname };
    }

    protected async findVersion(cmd: string, message?: string, cwd: string = ""): Promise<string> {
        try {
            const version = await UI.showLoading(
                new Subprocess([cmd, "--version"])
                    .cwd(cwd || import.meta.dirname)
                    .run(),
                message
            );
            return version.stdout() || "";
        } catch {
            return "";
        }
    }

    protected writeFiles(workdir: Directory, files: FileModifyTemplate[], data: Record<string, any>): FileModifyResults[] {

        if (!workdir.exists) workdir.makedirs();

        const results: FileModifyResults[] = [];

        files.forEach((f) => {
            const file = new File(path.join(workdir.abspath, f.filename));
            if (!file.exists) file.touch();

            const contents = new Template(path.join(this.templatepath, f.template))
                .pass(data)
                .render()
                .lines();

            switch (f.mode) {
                case Mode.Append:
                    try {
                        file.appendLines(contents);
                        results.push({ filename: f.filename, success: true });
                    } catch {
                        results.push({ filename: f.filename, success: false });
                    }
                    break;
                case Mode.Write:
                    try {
                        file.writeLines(contents);
                        results.push({ filename: f.filename, success: true });
                    } catch {
                        results.push({ filename: f.filename, success: false });
                    }
                    break;
                case Mode.Remove:
                    try {
                        file.rm();
                        results.push({ filename: f.filename, success: true });
                    } catch {
                        results.push({ filename: f.filename, success: false });
                    }
                    break;
            }
        });

        return results;
    }

    protected dryRun(workdir: Directory, changes: FileModifyTemplate[]) {
        const files = workdir.files();

        UI.echo([
            ...changes
                .filter((c) => c.mode === Mode.Create)
                .map((c) => UI.green(`${c.filename} << create`)),
            ...files
                .filter((f) => changes.map((c) => c.filename).includes(f) && (changes.find((c) => c.filename === f)?.mode === Mode.Append || changes.find((c) => c.filename === f)?.mode === Mode.Write))
                .map((c) => UI.cyan(`${c} << modify`)),
            ...files
                .filter((f) => changes.map((c) => c.filename).includes(f) && changes.find((c) => c.filename === f)?.mode === Mode.Remove)
                .map((c) => UI.red(`${c} << delete`)),
            ...files
                .filter((f) => !changes.map((c) => c.filename).includes(f))
                .map((f) => UI.white(f))

        ].sort().join("\n"));
    }



    protected showPreview(dirpath: string, changes: FileModifyPreview) {
        const files = new Directory(dirpath).files();
        UI.echo([
            ...changes.create.map((f) => UI.green(`${f} << create`)),
            ...files
                .filter((f) => changes.modify.includes(f))
                .map((f) => UI.yellow(`${f} << modify`)),
            ...files
                .filter((f) => changes.remove.includes(f))
                .map((f) => UI.red(`${f} << delete`)),
            ...files
                .filter((f) => !Object.values(changes).flat().includes(f))
                .map((f) => UI.white(f))

        ].map((i) => `   ${i}`).sort().join("\n"));
    }
}