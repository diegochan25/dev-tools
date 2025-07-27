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

    public override validate = (_: string) => true;

    public override capture(args: string[]): Entry<string, boolean> {
        let value: boolean = false;
        args.forEach((arg) => {
            if(this.flags.includes(arg)) {
                value = true;
            }
        })

        return new Entry(this.name, value);
    }
}
