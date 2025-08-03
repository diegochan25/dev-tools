import type { Entry, Primitive } from "@/types";

export abstract class Argument {
    protected name: string;
    protected description: string;
    protected abstract capture(argv: string[]): Entry<string, Primitive>;
    protected abstract validate<T>(arg: T): boolean;

    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }
}