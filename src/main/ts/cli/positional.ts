import { Entry, Enum, PositionalArgs } from "@/types";
import { Argument } from "./argument";
import { UI } from "./ui";

export class Positional extends Argument {
    public index: number;
    public options: string[] | Enum;

    constructor({
        name,
        description,
        index,
        options
    }: PositionalArgs) {
        super(name, description);

        this.index = index;
        this.options = options || [];
    }

    public validate(value: string): boolean {
        if (this.options instanceof Array) {
            return this.options.length === 0 || this.options.includes(value);
        } else {
            return Object.values(this.options).includes(value);
        }
    }

    public capture(args: string[]): Entry<string, any> {

        const value = args[this.index];

        if (value && this.validate(value)) { 
            return new Entry(this.name, value);
        } else {
            UI.error("Positional argument '%s' was not provided a valid option.", this.name);
            process.exit(1);
        }
    }
}
