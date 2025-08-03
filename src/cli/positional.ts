import { Entry, type PositionalArgs, type Primitive } from "@/types";
import { Argument } from "./argument";

export class Positional extends Argument {
    private index: number;
    constructor({
        name,
        description,
        index
    }: PositionalArgs) {
        super(name, description);
        this.index = index;
    }
    
    protected override capture(argv: string[]): Entry<string, Primitive> {
        if (argv.length <= this.index) {
            throw new Error("Finished parsing argument array before finding value for required argument '" + this.name + "'.");
        }

        const value = argv[this.index]!;

        if (!this.validate(value)) {
            throw new Error("Value '' for required argument")
        }

        return new Entry<string, Primitive>(this.name, argv[this.index]!);
    }
    
    protected override validate<T>(arg: T): boolean {
        throw new Error("Method not implemented.");
    }
}