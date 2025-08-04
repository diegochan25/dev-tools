import { Entry, type Enum, type PositionalArgs, type Primitive } from "@/types";
import { Argument } from "./argument";
import { Write } from "./write";

export class Positional extends Argument {
    private index: number;
    private options?: Enum<string>;
    constructor({
        name,
        description,
        index,
        options
    }: PositionalArgs) {
        super(name, description);
        this.index = index;
        this.options = options;
    }
    
    protected override capture(argv: string[]): Entry<string, Primitive> {
        if (argv.length <= this.index) {
            throw new Error("Finished parsing argument array before finding value for required argument '" + this._name + "'.");
        }

        const value = argv[this.index]!;
        this.validate(value);
        return new Entry<string, Primitive>(this._name, value);
    }
    
    protected override validate(value: string): void | never {
        if (this.options && !Object.values(this.options).includes(value)) {
           return Write.red("Value '%s' for required argument '%s' is not acceptable", value, this._name).exit(1);
        }
    }
}