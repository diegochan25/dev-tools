#! usr/bin/env bun

import { Command } from "@cli/command";
import { CommandBuilder } from "@cli/command-builder";
import { Positional } from "./cli/positional";
import { Flag } from "./cli/flag";
import { Optional } from "./cli/optional";
import { NestHandler } from "./handlers/nest-handler";

// Nest handlers
const nestCommands: NestHandler = new NestHandler();

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
    .addArgument(new Optional("runtime", "The JavaScript runtime to use when creating the project.", "node", ["node", "bun"/*, "deno" */], "--runtime", "-r"))
    .addArgument(new Flag("flat", "Do not create a new folder for the project's files", "--flat", "-f"))
    .addArgument(new Flag("dry-run", "Show a preliminary view of the files to be created or modified", "--dry-run", "-dr"))
    .setAction(nestCommands.createProject.bind(nestCommands))
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

