import util from "util";
import readline, { type Interface, type Key } from "readline";

export class Write {
    private static _green: string = "\x1b[32m";
    private static _cyan: string = "\x1b[36m";
    private static _yellow: string = "\x1b[33";
    private static _red: string = "\x1b[31m";
    private static _white: string = "\x1b[37m";
    private static _stop: string = "\x1b[0m";

    public static async question(q: string): Promise<string> {
        return new Promise((resolve) => {
            const sc: Interface = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            sc.question(q, (ans) => {
                sc.close();
                resolve(ans);
            });
        });
    }

    public static menu(options: string[], q: string = "Choose an option from the list below"): Promise<string> {
        return new Promise((resolve) => {
            let index: number = 0;
            const writeMenu = () => {
                Write.cls();
                Write.white(`${q} (Use ↑/↓ to navigate, Enter to confirm):`);
                options.forEach((opt, i) => {
                    if (i === index) {
                        Write.cyan(" > " + opt);
                    } else {
                        Write.white("   " + opt);
                    }
                });

                Write.line(Write._white + "Press " + Write._red + "Ctrl + C" + Write._white + " to abort.");
            };

            const onKey = (_: string, key: Key) => {
                switch (key.name) {
                    case "up":
                        index = (index - 1 + options.length) % options.length;
                        writeMenu();
                        break;
                    case "down":
                        index = (index + 1) % options.length;
                        writeMenu();
                        break;
                    case "return":
                        cleanup();
                        resolve(options[index]!);
                        break;
                    case "c":
                        if (key.ctrl) {
                            cleanup();
                            Write.red("Menu select aborted by user.").exit(0);
                        }
                        break;
                }
            };

            const cleanup = () => {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                process.stdin.off("keypress", onKey);
            };

            writeMenu();

            readline.emitKeypressEvents(process.stdin);
            process.stdin.setRawMode(true);
            process.stdin.resume();

            process.stdin.on("keypress", onKey);
        });
    }

    public static cls() {
        process.stdout.write("\x1B[2J\x1B[0f");
    }

    public static white(...args: any[]): typeof Write {
        process.stdout.write(Write._white + util.format(...args) + Write._stop);
        process.stdout.write("\n");
        return Write;
    }

    public static green(...args: any[]): typeof Write {
        process.stdout.write(Write._green + util.format(...args) + Write._stop);
        process.stdout.write("\n");
        return Write;
    }

    public static cyan(...args: any[]): typeof Write {
        process.stdout.write(Write._cyan + util.format(...args) + Write._stop);
        process.stdout.write("\n");
        return Write;
    }

    public static yellow(...args: any[]): typeof Write {
        process.stdout.write(Write._yellow + util.format(...args) + Write._stop);
        process.stdout.write("\n");
        return Write;
    }

    public static red(...args: any[]): typeof Write {
        process.stdout.write(Write._red + util.format(...args) + Write._stop);
        process.stdout.write("\n");
        return Write;
    }

    public static line(...args: any[]): typeof Write {
        process.stdout.write(util.format(...args));
        process.stdout.write("\n");
        return Write;
    }

    public static exit(code: string | number = 0): never {
        return process.exit(code);
    }
}

const choice = await Write.menu(["Option 1", "Option 2", "Option 3"], "Which one do you like?");

console.log(choice);

