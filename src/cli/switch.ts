import { Entry, type SwitchArgs, type Primitive } from "@/types";
import { Argument } from "./argument";

export class Switch extends Argument {
    public flags: string[]

    constructor({
        name,
        description,
        flags
    }: SwitchArgs) { 
        super(name, description);
        this.flags = flags;
    }

    protected override capture(argv: string[]): Entry<string, Primitive> {
        if (argv.some((arg) => this.flags.includes(arg))) {
            return new Entry(this._name, true);
        } else {
            return new Entry(this._name, false);
        }
    }

    protected override validate<T>(arg: T): void | never {
        return;
    }
}