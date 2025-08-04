import type { Entry, Primitive } from "@/types";

export abstract class Argument {
    protected _name: string;
    protected _description: string; 
    protected abstract validate(value: string): void | never;
    public abstract capture(argv: string[]): Entry<string, Primitive>;

    public get name(): string {
        return this.name;
    }

    public get description(): string {
        return this._description;
    }

    constructor(name: string, description: string) {
        this._name = name;
        this._description = description;
    }
}