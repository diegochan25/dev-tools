import { TraverseError } from "@error/traverse-error";
import { CommandBuilder } from "./command-builder";

export class Command {
    public name: string = "";
    public help: string = "";
    public subcommands: Command[] = [];
    private formalParameters: string[] = []; // TODO change type
    public action: (args: Map<string, any>) => void = () => console.warn("Action not implemented");
    
    public static builder = () => new CommandBuilder();

    public get helpString() {
        return [
            `Command '${this.name}':`,
            this.help,
            "-".repeat(64),
            "Subcommands",
            this.subcommands.reduce((acc, x) => acc + `    ${x.name}: ${x.help}\n`, ""),
        ].join("\n");
    }
    
    constructor() { }


    public traverse(args: string[]): void {
        const isThisHelp = (args: string[]) => args.length === 1 && ["-h", "--help"].includes(args[0])
        if(args.length === 0) {
            throw new TraverseError(
                "Reached end of command tree without finding appropriate command.", 
                TraverseError.REACHED_END_OF_TREE
            );
        } else {
            if (isThisHelp(args)) {
                
            }
        }
    }
}