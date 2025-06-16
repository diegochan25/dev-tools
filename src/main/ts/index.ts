#! /usr/bin/env bun

import { Command } from "@cli/command";
import { CommandBuilder } from "@cli/command-builder";
import { NestProject } from "./handlers/nest/project";

// devtools
const cli = CommandBuilder.buildRoot();

// devtools nest
Command.builder()
    .childOf(cli)
    .setName("nest")
    .setHelp("NestJS file creation commands. Use this command to generate modules, controllers, services, and other NestJS components quickly.")
    .addChild(NestProject.command)
    .build();

cli.traverse(process.argv.slice(2));

