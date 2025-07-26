#! /usr/bin/env bun

import { Command } from "@cli/command";
import { CommandBuilder } from "@cli/command-builder";
import {
    NestModule,
    NestController,
    NestService,
    NestFilter,
    NestEntity,
    NestResource,
    NestProject,
    NestPipe,
    NestGuard,
    NestInterceptor
} from "./handlers/nest";
import { ReactPage } from "./handlers/react/react-page";
import { NodeLambda } from "./handlers/javascript/node-lambda";
import { ConfigGet } from "./handlers/config/config-get";
import { ConfigSet } from "./handlers/config/config-set";
import { ConfigReset } from "./handlers/config/config-reset";


// devtools
const cli = CommandBuilder.buildRoot();

// devtools config
Command.builder()
    .childOf(cli)
    .setName("config")
    .setHelp("Configure the CLI's preferences.")
    .addChild(ConfigGet.command)
    .addChild(ConfigSet.command)
    .addChild(ConfigReset.command)
    .build();

// devtools js
Command.builder()
    .childOf(cli)
    .setName("js")
    .setHelp("Javascript-related utility commands. Use this command to create AWS lambda functions, etc.")
    .addChild(NodeLambda.command)
    .build();

// devtools nest
Command.builder()
    .childOf(cli)
    .setName("nest")
    .setHelp("NestJS file creation commands. Use this command to generate modules, controllers, services, and other NestJS components quickly.")
    .addChild(NestModule.command)
    .addChild(NestController.command)
    .addChild(NestService.command)
    .addChild(NestPipe.command)
    .addChild(NestFilter.command)
    .addChild(NestGuard.command)
    .addChild(NestInterceptor.command)
    .addChild(NestEntity.command)
    .addChild(NestResource.command)
    .addChild(NestProject.command)
    .build();

// devtools react 
Command.builder()
    .childOf(cli)
    .setName("react")
    .setHelp("React and Next.js file creation Commands. Use this command to generate pages, views, layouts, and empty css modules.")
    .addChild(ReactPage.command)
    .build()

cli.traverse(process.argv.slice(2));