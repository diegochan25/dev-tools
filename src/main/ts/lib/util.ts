import { UI } from "@/cli/ui"
import { Subprocess } from "@system/subprocess"

export const findVersion = async (cmd: string, cwd: string, message?: string): Promise<string> => {
    try {
        if (message) UI.echo(message);
        const cmdVersion = (await new Subprocess([
            cmd,
            "--version"
        ])
            .cwd(cwd)
            .run()
        ).stdout().trim();

        return cmdVersion;
    } catch {
        return "";
    }
}