import { Command } from "@cli/command";
import { CommandBuilder } from "@cli/command-builder";

const cli = CommandBuilder.buildRoot();

const nest: Command = Command.builder()
    .childOf(cli)
    .setName("nest")
    .setHelp("NestJS file creation commands. Use this command to generate modules, controllers, services, and other NestJS components quickly.")
    .build();

cli.traverse(process.argv.slice(2));

