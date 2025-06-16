import { Entry } from "@type/entry";
import { Argument } from "./argument";
import { UI } from "./ui";


export class Optional extends Argument {
    public def: string;
    public options: string[];
    public flags: string[];
    constructor(name: string, description: string, def: string, options: string[] = [], ...flags: string[]) {
        super(name, description);
        this.def = def;
        this.options = options;
        this.flags = flags.length > 0
            ? flags.map(f => f.trim())
            : [`--${this.name.trim()}`];
    }

    public capture(args: string[]): Entry<string, any> {
        let value: string | undefined = undefined;
        for (let i = 0; i < args.length; i++) {
            if (this.flags.includes(args[i])) {
                if (i + 1 >= args.length || args[i + 1].startsWith("-")) {
                    UI.echo(UI.red(`Optional argument '${this.name}' was not passed with a value.`));
                }
                value = args[i + 1];
                break;
            }
        }

        if (value) {
            if (this.options.length > 0 && !this.options.includes(value)) {
                UI.echo(UI.red(
                    `Invalid value '${value}' for optional argument '${this.name}'. Choose from '${this.options.join("', '")}'`
                ));
            }
            return new Entry(this.name, value);
        }

        return new Entry(this.name, this.def);
    }
}
