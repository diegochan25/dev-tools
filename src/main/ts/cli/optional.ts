import { Entry, Enum } from "@/types";
import { Argument } from "./argument";
import { UI } from "./ui";
import { CaseConverter } from "@/lib/case-converter";

export interface OptionalArgs {
    name: string;
    description: string;
    base: string;
    options?: string[] | Enum;
    flags?: string[]
}

export class Optional extends Argument {
    public base: string;
    public options: string[] | Enum;
    public flags: string[];
    constructor({
        name,
        description,
        base,
        options,
        flags
    }: OptionalArgs) {
        super(name, description);
        this.base = base;
        this.options = options || [];
        this.flags = flags || [`--${CaseConverter.convert(name).kebab}`];
    }

    public validate(value: string): boolean {
        if (this.options instanceof Array) {
            return this.options.length === 0 || this.options.includes(value);
        } else {
            return Object.values(this.options).includes(value);
        }
    }

    public capture(args: string[]): Entry<string, any> | void {
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
            if (this.validate(value)) {
                return new Entry(this.name, value);
            } else {
                UI.error("Invalid option '%s' for optional argument '%s'", value, this.name)
                process.exit(1);
            }
        } else {
            return new Entry(this.name, this.base);
        }
    }
}