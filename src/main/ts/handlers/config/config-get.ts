import path from "path";
import { strings } from "@resources/strings";
import { File } from "@system/file";
import { Positional } from "@cli/positional";
import { Primitive } from "@/types";
import { Command } from "@cli/command";
import { abortable, requires } from "@lib/decorators";
import { ConfigProfile } from "@/config/config-profile";
import { DEFAULT_CONFIG } from "@/config/default-config";
import { UI } from "@/cli/ui";
import { Switch } from "@/cli/switch";
import { getNestedProperty } from "@/lib/util";


export class ConfigGet {

    @abortable
    @requires("name")
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const name = args.get("name") as string;
        const _default = args.get("default") as boolean;
        const configFile = new File(path.join(strings.ROOT_DIR, "config.json"));
        if(!configFile.exists) configFile.ensure();

        const keys = name.split(".");

        if (_default) {
            UI.write(
                UI.white("Default value for property %s: ") +
                UI.cyan(getNestedProperty(DEFAULT_CONFIG, keys)),
                name
            ).exit(0);
        }

        let config = configFile.read().json<ConfigProfile>();
        if (!config) {
            config = DEFAULT_CONFIG;
            configFile.writeJson(config);
        }

        const value = getNestedProperty(config, keys);

        if (value) {
            UI.write(
                UI.white("Property %s: ") + UI.cyan(String(value)),
                name
            ).exit(0);
        } else {
            UI.warning("Property '%s' does not exist on the CLI config.", name).exit(1);
        }
    }

    public static get command(): Command {
        return Command.builder()
            .setName("get")
            .setHelp("Get the value of a specified config rule. Get nested config rules with periods (e.g. javascript.quotes)")
            .addArgument(new Positional({
                name: "name",
                description: "The name of the rule to retrieve.",
                index: 0
            }))
            .addArgument(new Switch({
                name: "default",
                description: "Get the default value of the config rule",
                flags: ["--default", "-d"]
            }))
            .setAction(this.action)
            .build();
    }
}