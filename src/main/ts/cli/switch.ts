import { Entry } from "@/types";
import { Argument } from "./argument";
import { CaseConverter } from "@/lib/case-converter";


export interface SwitchArgs {
    name: string;
    description: string;
    flags?: string[];
}

export class Switch extends Argument {
    public flags: string[];

    constructor({
        name,
        description,
        flags
    }: SwitchArgs) {
        super(name, description);
        this.flags = flags || [`--${CaseConverter.convert(name).kebab}`];
    }

    public validate = (value: string) => true;

    
    public capture(args: string[]): Entry<string, boolean> {
        return new Entry(this.name, args.some((a) => this.flags.includes(a)));
    }
}
