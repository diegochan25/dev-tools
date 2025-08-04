import type { Argument } from "@/cli/argument";

export type Primitive = number | string | boolean;

export type Action = (args: Map<string, Primitive>) => void | Promise<void>;

export class Entry<K = any, V = any> {
    public key: K;
    public value: V;

    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }

    public tuple(): [K, V] {
        return [this.key, this.value];
    }
}

export interface PositionalArgs {
    name: string;
    description: string;
    index: number;
    options?: Enum<string>;
}

export interface CommandArgs {
    name: string;
    help: string;
    args: Set<Argument>;
    action: Action;
}

export type Enum<T extends string | number = number> = Record<string, T>;

export interface OptionalArgs {
    name: string;
    description: string;
    options?: Enum<string>;
    selected?: string;
    flags: string[]
}

export interface SwitchArgs {
    name: string;
    description: string;
    flags: string[];
}