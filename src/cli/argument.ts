import { Entry } from "@type/key-value-pair";
import { ParserError } from "@error/parser-error";

export abstract class Argument {
    public name: string;
    public description: string;
    public abstract capture(args: string[]): Entry<string, any>;

    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }
}

export class Positional extends Argument {
    index: number;
    constructor(name: string, description: string, index: number) {
        super(name, description);
        this.index = index;
    }

    public capture(args: string[]): Entry<string, any> {
        if (!args[this.index]) {
            throw new ParserError(`Required argument '${this.name}' was not provided a value.`, ParserError.MISSING_REQUIRED_ARGUMENT);
        }
        return new Entry(this.name, args[this.index]);
    }
}

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
        args.forEach((arg, i) => {
            if(this.flags.includes(arg)) {
                if (i >= args.length || args[i+1].startsWith("-")) {
                    throw new ParserError(`Optional argument '${this.name}' needs to be passed with a value.`)
                } 
                value = args[i+1];
            }
        });

        if(value) {
            return new Entry(this.name, value)
        }

        return new Entry(this.name, this.def);
    }
}

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