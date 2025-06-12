import { Directory } from "@/lib/directory";
import { FileModifyPreview } from "@/types/file-modify-preview";
import { UI } from "@cli/ui";
import { Subprocess } from "@lib/subprocess";
import path from "path";

export abstract class HandlerBase {
    protected get templatepath(): string {
        return path.resolve(path.join(import.meta.dirname, "..", "templates"));
    }

    protected splitPath(filepath: string, flat: boolean): [string, string] {
        const filename = path.basename(filepath);
        const dirname = path.resolve((flat ? path.dirname(filepath) : filepath));
        return [filename, dirname];
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

    protected showPreview(dirpath: string, changes: FileModifyPreview) {
        const files = new Directory(dirpath).files();
        UI.echo([
            ...changes.create.map((f) => UI.green(`${f} << create`)),
            ...files
                .filter((f) => changes.modify.includes(f))
                .map((f) => UI.yellow(`${f} << modify`)),
            ...files
                .filter((f) => changes.remove.includes(f))
                .map((f) =>  UI.red(`${f} << delete`)),
            ...files
                .filter((f) => !Object.values(changes).flat().includes(f))
                .map((f) => UI.white(f))

        ].map((i) => `   ${i}`).sort().join("\n"));
    }
}