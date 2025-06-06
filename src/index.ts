import { Command } from "@cli/command";
import { CommandBuilder } from "@cli/command-builder";
import { Positional } from "./cli/positional";
import { Flag } from "./cli/flag";

Number.isDigit = function (str: string): boolean {
    return /^\d$/.test(str);
};

String.prototype.removePrefix = function (prefix: string | RegExp): string {
    if (typeof prefix === "string") {
        return this.startsWith(prefix) ? this.slice(prefix.length) : this.toString();
    } else if (prefix instanceof RegExp) {
        return this.replace(prefix, (match, offset) => (offset === 0 ? "" : match));
    }
    return this.toString();
};

String.prototype.removeSuffix = function (suffix: string | RegExp): string {
    if (typeof suffix === "string") {
        return this.endsWith(suffix) ? this.slice(0, this.length - suffix.length) : this.toString();
    } else if (suffix instanceof RegExp) {
        const match = this.match(suffix);
        if (match && match.index === this.length - match[0].length) {
            return this.slice(0, match.index);
        }
    }
    return this.toString();
};

String.prototype.isUpperCase = function (): boolean {
    return this.toString() === this.toString().toUpperCase();
};

String.prototype.isLowerCase = function (): boolean {
    return this.toString() === this.toString().toLowerCase();
};

String.prototype.capitalize = function (): string {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

// devtools
const cli = CommandBuilder.buildRoot();

// devtools nest
const nest: Command = Command.builder()
    .childOf(cli)
    .setName("nest")
    .setHelp("NestJS file creation commands. Use this command to generate modules, controllers, services, and other NestJS components quickly.")
    .build();

// devtools nest project
const nestProject: Command = Command.builder()
    .childOf(nest)
    .setName("project")
    .setHelp("Create a NestJS project. Use this command to scaffold a new NestJS project.")
    .addArgument(new Positional("path", "The path where the NestJS project will be created.", 0))
    .addArgument(new Flag("flat", "Do not create a new folder for the project's files", "--flat", "-f"))
    .addArgument(new Flag("dry-run", "Show a preliminary view of the files to be created or modified", "--dry-run", "-dr"))
    .build();

// devtools nest resource
const nestResource: Command = Command.builder()
    .childOf(nest)
    .setName("resource")
    .setHelp("Generate a new NestJS CRUD resource.")
    .addArgument(new Positional("path", "The path where the NestJS resource will be created.", 0))
    .addArgument(new Flag("flat", "Do not create a new folder for the project's files", "--flat", "-f"))
    .addArgument(new Flag("dry-run", "Show a preliminary view of the files to be created or modified", "--dry-run", "-dr"))
    .build();

const nestController: Command = Command.builder()
    .childOf(nest)
    .setName("controller")
    .setHelp("Generate a new NestJS controller.")
    .addArgument(new Positional("path", "The path where the controller will be created.", 0))
    .addArgument(new Flag("flat", "Do not create a new folder for the controller's files", "--flat", "-f"))
    .addArgument(new Flag("dry-run", "Show a preliminary view of the files to be created or modified", "--dry-run", "-dr"))
    .build();

const nestModule: Command = Command.builder()
    .childOf(nest)
    .setName("module")
    .setHelp("Generate a new NestJS module.")
    .addArgument(new Positional("path", "The path where the module will be created.", 0))
    .addArgument(new Flag("flat", "Do not create a new folder for the module's files", "--flat", "-f"))
    .addArgument(new Flag("dry-run", "Show a preliminary view of the files to be created or modified", "--dry-run", "-dr"))
    .build();

const nestService: Command = Command.builder()
    .childOf(nest)
    .setName("service")
    .setHelp("Generate a new NestJS service.")
    .addArgument(new Positional("path", "The path where the service will be created.", 0))
    .addArgument(new Flag("flat", "Do not create a new folder for the service's files", "--flat", "-f"))
    .addArgument(new Flag("dry-run", "Show a preliminary view of the files to be created or modified", "--dry-run", "-dr"))
    .build();

cli.traverse(process.argv.slice(2));

