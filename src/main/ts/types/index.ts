export interface CaseMap {
    camel: string;
    pascal: string;
    snake: string;
    upper: string;
    kebab: string;
    spaced: string;
}

export type CommandAction = (args: Map<string, Primitive>) => void | Promise<void>;

export class Entry<K, V> {
    key: K;
    value: V;
    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }
}

export interface FileModifyTemplate {
    filename: string;
    template: string;
    mode: Mode;
}

export interface FileModifyPreview {
    create: string[]
    modify: string[]
    remove: string[]
}

export interface FileModifyResults {
    filename: string;
    success: boolean;
}

export enum Mode {
    Create,
    Append,
    Write,
    Remove
}

export interface NestModuleDecorator {
    moduleImports: string[];
    imports: string[];
    controllers: string[];
    providers: string[];
    exports: string[];
}

export enum ORMs {
    TypeOrm = "typeorm",
    Sequelize = "sequelize",
    Prisma = "prisma",
    MikroOrm = "mikroorm"
}

export enum PackageManagers {
    npm = "npm",
    yarn = "yarn",
    pnpm = "pnpm",
    bun = "bun"
}

export type Enum = Record<string, string | number>;

export interface PositionalArgs {
    name: string;
    description: string;
    index: number;
    options?: string[] | Enum;
}


export type Primitive = number | string | boolean;