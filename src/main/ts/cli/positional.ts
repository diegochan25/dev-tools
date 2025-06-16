import { Entry, PositionalArgs } from "@/types";
import { Argument } from "./argument";
import { UI } from "./ui";

export class Positional extends Argument {
    public index: number;
    public options: string[];

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

    public capture(args: string[]): Entry<string, any> {
        if (!args[this.index]) {
            UI.echo(UI.red(`A value for required parameter '${this.name}' was not provided.`));
        }
        const value = args[this.index];

        if (this.options.length > 0 && !this.options.includes(value)) {
            UI.echo(UI.red(`Invalid value '${value}' for required argument '${this.name}'. Choose from '${this.options.join("', '")}'.`));
        }
        return new Entry(this.name, value);
    }
}
