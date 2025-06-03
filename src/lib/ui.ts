import readline from "readline";

export class UI {
    private static reset = "\x1b[0m";
    private static cyan = "\x1b[96m";
    private static gray = "\x1b[90m";
    private static green = "\x1b[92m";
    private static red = "\x1b[91m";
    private static yellow = "\x1b[93m";
    private static white = "\x1b[97m";
    private static cls = "\x1B[2J\x1B[0f";
    private static tab = "   ";
    private static cursor = " > ";


    public static menuSelect(options: string[], instruction: string = ""): Promise<string> {
        return new Promise((resolve) => {
            let selected = 0;

            const showMenu = () => {
                process.stdout.write(this.cls);
                if (instruction) console.log(instruction);
                console.log("Use ↑/↓ to navigate, Enter to select:\n");
                options.forEach((option, i) => {
                    const line = i === selected
                        ? this.cyan + this.cursor + option + this.reset
                        : this.white + this.tab + option + this.reset;
                    console.log(line);
                });
            };

            readline.emitKeypressEvents(process.stdin);
            process.stdin.setRawMode(true);
            process.stdin.resume();

            showMenu();

            const cleanup = () => {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                process.stdin.off("keypress", onKey);
            };

            const onKey = (_: string, key: readline.Key) => {
                if (key.name === "up") {
                    selected = (selected - 1 + options.length) % options.length;
                    showMenu();
                } else if (key.name === "down") {
                    selected = (selected + 1) % options.length;
                    showMenu();
                } else if (key.name === "return") {
                    cleanup();
                    resolve(options[selected]);
                } else if (key.ctrl && key.name === "c") {
                    process.stdin.setRawMode(false);
                    process.stdin.pause();
                    process.stdin.off("keypress", onKey);
                    resolve("");
                }
            };
            process.stdin.on("keypress", onKey);
        });
    }
}