import { FileError } from "@error/file-error";
import fs from "fs";
import path from "path";

export class Directory {
    private dirpath: string;
    private _items: string[];

    constructor(dirpath: string) {
        this.dirpath = path.resolve(dirpath);
        this._items = []
    }

    public get exists(): boolean {
        return fs.existsSync(this.dirpath) && fs.statSync(this.dirpath).isDirectory();
    }

    public get empty(): boolean {
        if (!this.exists) {
            throw new FileError("Directory '" + this.dirpath + "' does not exist.");
        }
        return fs.readdirSync(this.dirpath).length === 0;
    }

    public get basename(): string {
        return path.basename(this.dirpath);
    }

    public get dirname(): string {
        return path.dirname(this.dirpath);
    }

    public get abspath(): string {
        return path.resolve(this.dirpath);
    }

    public mkdir(): this {
        if (this.exists) {
            throw new FileError("Directory '" + this.dirpath + "' already exists.");
        }

        const dirname = this.dirname;

        if (!fs.existsSync(dirname)) {
            throw new FileError("Parent directory '" + dirname + "' does not exist.");
        }

        fs.mkdirSync(this.dirpath);
        return this;
    }

    public makedirs(): this {
        if (this.exists) {
            throw new FileError("Directory '" + this.dirpath + "' already exists.");
        }

        fs.mkdirSync(this.dirpath, { recursive: true });
        return this;
    }

    public rm(): this {
        if (!this.exists) {
            throw new FileError("Directory '" + this.dirpath + "' does not exist.");
        }

        fs.rmdirSync(this.dirpath, { recursive: true });
        return this;
    }

    public ls(): this {
        if (this.exists) {
            this._items = fs.readdirSync(this.dirpath);
        } else {
            this._items = [];
        }

        return this
    }

    public items(): string[] {
        return this.ls()._items;
    }

    public files(): string[] {
        return this.ls()._items.filter(item => fs.statSync(path.join(this.dirpath, item)).isFile());
    }

    public dirs(): string[] {
        return this.ls()._items.filter(item => fs.statSync(path.join(this.dirpath, item)).isDirectory());
    }
}
