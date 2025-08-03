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
}

export interface PositionalArgs {
    name: string;
    description: string;
    index: number;
}

export interface CommandArgs {
    name: string;
    help: string;
    args: Set<Argument>;
    action: Action;
}