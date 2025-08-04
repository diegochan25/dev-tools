import util from "util";
import readline, { type Interface, type Key } from "readline";

export class Write {
    private static _u: string = "\x1b[4m";
    private static _green: string = "\x1b[32m";
    private static _cyan: string = "\x1b[36m";
    private static _yellow: string = "\x1b[33m";
    private static _red: string = "\x1b[31m";
    private static _white: string = "\x1b[37m";
    private static _stop: string = "\x1b[0m";
    private static _spinner = ["◜", "◠", "◝", "◞", "◡", "◟"];
    private static _cr: string = "\r";
    private static _lf: string = "\n";

    public static async load<T = any>(
        task: (...args: any[]) => Promise<T>,
        message?: string
    ): Promise<T> {
        let i = 0;
        if (message) Write.white(message);

        const interval = setInterval(() => {
            Write.inline(Write._cr + Write._cyan + this._spinner[i++ % this._spinner.length] + Write._stop + " ");
        }, 80);

        const result = await task();

        clearInterval(interval);
        process.stdout.write("\r \r");

        return result;
    }

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

                Write.block(Write._white + "Press " + Write._red + "Ctrl + C" + Write._white + " to abort.");
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

    public static multipleChoice(options: string[], q: string = "Choose all appropiate options from the list below"): Promise<string[]> {
        return new Promise((resolve) => {
            let index: number = 0;
            const choices: Set<number> = new Set();
            const writeMenu = () => {
                Write.cls();
                Write.white(`${q} (Use ↑/↓ to navigate, Space to select, Enter to confirm):`);
                options.forEach((opt, i) => {
                    if (choices.has(i) && i === index) {
                        Write.block(Write._cyan + " > " + Write._u + opt + Write._stop);
                    } else if (i === index) {
                        Write.cyan(" > " + opt);
                    } else if (choices.has(i)) {
                        Write.block(Write._cyan + "   " + Write._u + opt + Write._stop);
                    } else {
                        Write.white("   " + opt);
                    }
                });

                Write.block(Write._white + "Press " + Write._red + "Ctrl + C" + Write._white + " to abort.");
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
                    case "space":
                        if (choices.has(index)) {
                            choices.delete(index);
                        } else {
                            choices.add(index);
                        }
                        writeMenu();
                        break;
                    case "return":
                        cleanup();
                        resolve([...choices].map(i => options[i]!));
                        break;
                    case "c":
                        if (key.ctrl) {
                            cleanup();
                            Write.red("Multiple choice select aborted by user.").exit(0);
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
        process.stdout.write("\x1b[2J\x1b[H");
    }

    public static white(...args: any[]): typeof Write {
        process.stdout.write(Write._white + util.format(...args) + Write._stop);
        process.stdout.write(Write._lf);
        return Write;
    }

    public static green(...args: any[]): typeof Write {
        process.stdout.write(Write._green + util.format(...args) + Write._stop);
        process.stdout.write(Write._lf);
        return Write;
    }

    public static cyan(...args: any[]): typeof Write {
        process.stdout.write(Write._cyan + util.format(...args) + Write._stop);
        process.stdout.write(Write._lf);
        return Write;
    }

    public static yellow(...args: any[]): typeof Write {
        process.stdout.write(Write._yellow + util.format(...args) + Write._stop);
        process.stdout.write(Write._lf);
        return Write;
    }

    public static red(...args: any[]): typeof Write {
        process.stdout.write(Write._red + util.format(...args) + Write._stop);
        process.stdout.write(Write._lf);
        return Write;
    }

    public static inline(...args: any[]): typeof Write {
        process.stdout.write(util.format(...args));
        return Write;
    }

    public static block(...args: any[]): typeof Write {
        process.stdout.write(util.format(...args));
        process.stdout.write(Write._lf);
        return Write;
    }

    public static exit(code: string | number = 0): never {
        return process.exit(code);
    }
}

const p = () => new Promise((resolve) => {
    setTimeout(() => resolve("Cool!"), 5000);
});

const cool = await Write.load(p);