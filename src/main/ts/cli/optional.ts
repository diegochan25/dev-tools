import { Entry } from "@/types";
import { Argument } from "./argument";
import { UI } from "./ui";
import { CaseConverter } from "@/lib/case-converter";

export interface OptionalArgs {
    name: string;
    description: string;
    def: string;
    options?: string[],
    flags?: string[]
}

export class Optional extends Argument {
    public def: string;
    public options: string[];
    public flags: string[];
    constructor({
        name,
        description,
        def,
        options,
        flags
    }: OptionalArgs) {
        super(name, description);
        this.def = def;
        this.options = options || [];
        this.flags = flags || [`--${CaseConverter.convert(name).kebab}`];
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
