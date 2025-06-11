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
}