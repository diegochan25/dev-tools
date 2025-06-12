import { Entry } from "@type/entry";

export abstract class Argument {
    public name: string;
    public description: string;
    public abstract capture(args: string[]): Entry<string, any>;

    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }
}