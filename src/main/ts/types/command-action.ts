import { Primitive } from "./primitive";

export type CommandAction = (args: Map<string, Primitive>) => void | Promise<void>;