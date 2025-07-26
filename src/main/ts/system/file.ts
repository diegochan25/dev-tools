import { FileError } from "@error/file-error";
import fs from "fs"
import path from "path";

export class File {
    private filepath: string;
    private static defaultEncoding: BufferEncoding = "utf-8";
    private content: string;

    constructor(...paths: string[]) {
        this.filepath = path.resolve(path.join(...paths));
        this.content = "";
    }

    public get empty(): boolean {
        return this.read().text().trim().length === 0;
    }

    public get abspath(): string {
        return path.resolve(this.filepath);
    }

    public get dirname(): string {
        return path.dirname(this.filepath);
    }

    public get basename(): string {
        return path.basename(this.filepath);
    }

    public get filename(): string {
        return path.basename(this.filepath).replace(path.extname(this.filepath), "");
    }

    public get ext(): string {
        return path.extname(this.filepath).replace(/^\./, "");
    }

    public get exists(): boolean {
        return fs.existsSync(this.filepath);
    }

    public mkdir(): this {
        const thisdir = path.basename(this.dirname);
        const dirpath = path.dirname(this.dirname);

        if (fs.existsSync(this.dirname)) {
            throw new FileError("Directory '" + this.dirname + "' already exists");
        }

        if (!fs.existsSync(dirpath)) {
            throw new FileError("Create all directories in path '" + dirpath + "' before creating directory '" + thisdir + "'")
        }

        fs.mkdirSync(this.dirname, { recursive: false });
        return this;
    }

    public makedirs(): this {
        if (fs.existsSync(this.dirname)) {
            throw new FileError("Directory '" + this.dirname + "' already exists");
        }

        fs.mkdirSync(this.dirname, { recursive: true });
        return this;
    }

    public ensure(): this {
        fs.mkdirSync(this.dirname, { recursive: true });

        if (!fs.existsSync(this.filepath)) {
            fs.closeSync(fs.openSync(this.filepath, "w"));
        } else {
            const now = new Date();
            fs.utimesSync(this.filepath, now, now);
        }
        return this;
    }

    public touch(): this {
        if (!fs.existsSync(this.dirname)) {
            throw new FileError("Directory '" + this.dirname + "': not found.")
        }

        if (!fs.existsSync(this.filepath)) {
            fs.closeSync(fs.openSync(this.filepath, "w"));
        } else {
            const now = new Date();
            fs.utimesSync(this.filepath, now, now);
        }

        return this;
    }

    public append(data: string | Uint8Array, options?: fs.WriteFileOptions): this {
        if (!fs.existsSync(this.filepath)) {
            throw new FileError("Create file at path '" + this.filepath + "' before appending to it.")
        }

        if (this.empty) {
            fs.appendFileSync(this.filepath, data, options);
        } else {
            fs.appendFileSync(this.filepath, "\n" + data, options);
        }

        this.read();
        return this;
    }

    public appendLines(data: string[], options?: fs.WriteFileOptions): this {
        if (!fs.existsSync(this.filepath)) {
            throw new FileError("Create file at path '" + this.filepath + "' before appending to it.")
        }

        if (this.empty) {
            fs.appendFileSync(this.filepath, data.join("\n"), options);
        } else {
            fs.appendFileSync(this.filepath, "\n" + data.join("\n"), options);
        }

        this.read();
        return this;
    }

    public write(data: string | NodeJS.ArrayBufferView, options?: fs.WriteFileOptions): this {
        if (!fs.existsSync(this.filepath)) {
            throw new FileError("Create file at path '" + this.filepath + "' before overwriting it.")
        }

        fs.writeFileSync(this.filepath, data, options);
        this.read();
        return this;
    }

    public writeLines(data: string[], options?: fs.WriteFileOptions): this {
        if (!fs.existsSync(this.filepath)) {
            throw new FileError("Create file at path '" + this.filepath + "' before overwriting it.")
        }

        fs.writeFileSync(this.filepath, data.join("\n"), options);
        this.read();
        return this;
    }

    public writeJson(json: any, options?: fs.WriteFileOptions): this {
        if (!fs.existsSync(this.filepath)) {
            throw new FileError("Create file at path '" + this.filepath + "' before overwriting it.")
        }

        fs.writeFileSync(this.filepath, JSON.stringify(json, null, 4), options);
        this.read();
        return this;
    }

    public read(encoding?: BufferEncoding): this {
        encoding = encoding || File.defaultEncoding;
        if (!this.exists) {
            throw new FileError("Ensure file '" + this.filepath + "' exists before reading from it.");
        }
        this.content = fs.readFileSync(this.filepath, { encoding });

        return this;
    }

    public rm(): void {
        if (!this.exists) {
            throw new FileError("Non-existent file '" + this.filepath + "' cannot be removed.");
        }

        if (fs.statSync(this.filepath).isDirectory()) {
            throw new FileError("Path '" + this.filepath + "' is a directory, not a file.");
        }

        fs.unlinkSync(this.filepath);
        return;
    }

    public json<T = any>(): T | undefined {
        try {
            return JSON.parse(this.content) as T;
        } catch (error) {
            return undefined;
        }
    }

    public text(): string {
        return this.content;
    }

    public lines(): string[] {
        return this.content.split(/\r\n|\r|\n/);
    }
}