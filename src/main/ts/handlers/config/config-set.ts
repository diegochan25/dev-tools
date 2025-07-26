import path from "path";
import { strings } from "@resources/strings";
import { File } from "@system/file";
import { Positional } from "@cli/positional";
import { Primitive } from "@/types";
import { Command } from "@cli/command";
import { abortable, requires } from "@lib/decorators";
import { ConfigProfile } from "@/config/config-profile";
import { DEFAULT_CONFIG } from "@/config/default-config";
import { getNestedProperty, setNestedProperty } from "@/lib/util";
import { UI } from "@/cli/ui";


export class ConfigSet {

    @abortable
    @requires("name")
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const name = args.get("name") as string;
        const value = args.get("value") as string;
        const configFile = new File(path.join(strings.ROOT_DIR, "config.json"));
        if (!configFile.exists) configFile.ensure();

        const config = configFile.read().json<ConfigProfile>();

        const keys = name.split(".");

        if (!config) configFile.writeJson(DEFAULT_CONFIG);

        const current = getNestedProperty(config, keys);
        let newvalue: any = undefined;

        if (value === current) {
            UI.write(
                UI.white("Property ") +
                UI.cyan(name) +
                UI.white(" is already set to ") +
                UI.cyan(typeof current === "string" ? "'" + current + "'" : current) +
                UI.white(".")
            ).exit(0)
        }

        if (["--default", "-d"].includes(value)) {
            if (getNestedProperty(DEFAULT_CONFIG, keys) === getNestedProperty(config, keys)) {
                UI.write(
                    UI.white("Property ") +
                    UI.cyan(name) +
                    UI.white(" is already set to default ") +
                    UI.cyan(typeof current === "string" ? "'" + current + "'" : current) +
                    UI.white(".")
                ).exit(0); 
            }

            newvalue = getNestedProperty(DEFAULT_CONFIG, keys);
        } else {
            newvalue = value;
        }
        setNestedProperty(config, keys, newvalue);
        configFile.writeJson(config);

        UI.write(
            UI.green("Property ") +
            UI.cyan(name) +
            UI.green(" successfully changed from ") +
            UI.cyan(typeof current === "string" ? "'" + current + "'" : current) +
            UI.green(" to ") +
            UI.cyan(typeof newvalue === "string" ? "'" + newvalue + "'" : newvalue) +
            UI.green("!")
        ).exit(0)
    }

    public static get command(): Command {
        return Command.builder()
            .setName("set")
            .setHelp("Change the value of a specified config rule. Get nested config rules with periods (e.g. javascript.quotes)")
            .addArgument(new Positional({
                name: "name",
                description: "The name of the rule to retrieve.",
                index: 0
            }))
            .addArgument(new Positional({
                name: "value",
                description: "Set the new value of the config rule. Use the special value '--default' ('-d') to set the value back to its default.",
                index: 1
            }))
            .setAction(this.action)
            .build();
    }
}