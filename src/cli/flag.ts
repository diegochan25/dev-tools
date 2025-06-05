import { Entry } from "@type/entry";
import { Argument } from "./argument";


export class Flag extends Argument {
    public flags: string[];

    constructor(name: string, description: string, ...flags: string[]) {
        super(name, description);

        this.flags = flags.length > 0
            ? flags.map(f => f.trim())
            : [`--${this.name.trim()}`];
    }

    public capture(args: string[]): Entry<string, boolean> {
        return new Entry(this.name, args.some((a) => this.flags.includes(a)));
    }
}
