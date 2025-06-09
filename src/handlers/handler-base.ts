import path from "path";

export abstract class HandlerBase {
    protected get templatepath(): string {
        return path.resolve(path.join(import.meta.dirname, "..", "templates"));
    }

    protected splitPath(filepath: string, flat: boolean): [string, string] {
        const filename = path.basename(filepath);
        const dirname = path.resolve((flat ? path.dirname(filepath) : filepath));
        return  [filename, dirname];
    }
}