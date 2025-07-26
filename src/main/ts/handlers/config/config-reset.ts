import { Command } from "@/cli/command";
import { File } from "@/system/file";
import { Switch } from "@/cli/switch";
import { UI } from "@/cli/ui";
import { abortable, requires } from "@/lib/decorators";
import path from "path";
import { strings } from "@resources/strings";
import { Primitive } from "@/types";
import { DEFAULT_CONFIG } from "@/config/default-config";

export class ConfigReset {
    @abortable
    @requires("yes")
    public static async action(args: Map<string, Primitive>): Promise<void> {
        const yes = args.get("yes") as boolean;

        const confirmed = yes || await UI.confirm("Are you sure you want to reset the config profile? Your current preferences cannot be restored.");
        
        if (!confirmed) {
            UI.warning("Command execution aborted by user.").exit(1);
        }

        const configFile = new File(path.join(strings.ROOT_DIR, "config.json"));
        if (!configFile.exists) configFile.ensure();

        configFile.writeJson(DEFAULT_CONFIG);

        UI.success("Configuration file reset successfully!");
    }

    public static get command(): Command {
        return Command.builder()
            .setName("reset")
            .setHelp("Reset the CLI's config profile to its defaults.")
            .addArgument(new Switch({
                name: "yes",
                description: "Skip the confirmation dialog",
                flags: ["-y"]
            }))
            .setAction(this.action)
            .build();
    }
}