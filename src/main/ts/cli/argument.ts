import { Entry } from "@/types";

export abstract class Argument {
    public name: string;
    public description: string;
    public abstract validate(value: string): boolean;
    public abstract capture(args: string[]): Entry<string, any> | void;

    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }
}