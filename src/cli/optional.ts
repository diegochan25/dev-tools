import { Entry, type Enum, type OptionalArgs, type Primitive } from "@/types";
import { Argument } from "./argument";

export class Optional extends Argument {
    public options?: Enum<string>;
    public selected: string;
    public flags: string[]

    constructor({
        name,
        description,
        options,
        selected,
        flags
    }: OptionalArgs) { 
        super(name, description);
        this.options = options;
        this.selected = selected ?? "";
        this.flags = flags;
    }

    protected override capture(argv: string[]): Entry<string, Primitive> {
        const i = argv.findIndex((arg) => this.flags.includes(arg)) + 1;
        if (i === 0 || i === argv.length) return new Entry(this.name, this.selected);
        
        return new Entry(this.name, argv[i]!);
    }

    protected override validate<T>(arg: T): boolean {
        throw new Error("Method not implemented.");
    }

}