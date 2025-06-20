#! /usr/bin/env bun

import { Command } from "@cli/command";
import { CommandBuilder } from "@cli/command-builder";
import { NestProject } from "./handlers/nest/nest-project";
import { NestResource } from "./handlers/nest/nest-resource";
import { NestEntity } from "./handlers/nest/nest-entity";
import { NestController } from "./handlers/nest/nest-controller";

// devtools
const cli = CommandBuilder.buildRoot();

// devtools nest
Command.builder()
    .childOf(cli)
    .setName("nest")
    .setHelp("NestJS file creation commands. Use this command to generate modules, controllers, services, and other NestJS components quickly.")
    .addChild(NestController.command)
    .addChild(NestEntity.command)
    .addChild(NestProject.command)
    .addChild(NestResource.command)
    .build();

cli.traverse(process.argv.slice(2));

