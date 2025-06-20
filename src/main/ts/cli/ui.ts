import { Primitive } from "@/types";
import readline from "readline";
import util from "util";

export class UI {
    public static cyan = (str: string) => "\x1b[96m" + str + "\x1b[0m";
    public static gray = (str: string) => "\x1b[90m" + str + "\x1b[0m";
    public static green = (str: string) => "\x1b[92m" + str + "\x1b[0m";
    public static red = (str: string) => "\x1b[91m" + str + "\x1b[0m";
    public static yellow = (str: string) => "\x1b[93m" + str + "\x1b[0m";
    public static white = (str: string) => "\x1b[97m" + str + "\x1b[0m";

    private static spinner = ["◜", "◠", "◝", "◞", "◡", "◟"];
    private static cls = "\x1B[2J\x1B[0f";
    private static tab = "   ";
    private static cursor = " > ";
    private static cr = "\r";
    private static lf = "\n";


    public static async showLoading<T = any>(
        task: Promise<T> | ((...args: any[]) => Promise<T>),
        message?: string
    ): Promise<T> {
        let i = 0;

        if (message) {
            process.stdout.write(`${UI.white(message)}\n`);
        }

        const interval = setInterval(() => {
            const char = UI.spinner[i % UI.spinner.length];
            process.stdout.write(`\r\x1B[2K${UI.cyan(char)}`);
            i++;
        }, 80);

        try {
            const result = task instanceof Promise ? await task : await task();
            return result;
        } finally {
            clearInterval(interval);
            process.stdout.write(`\r\x1B[2K`);
        }
    }


    public static menuSelect(options: string[], instruction: string = ""): Promise<string> {
        return new Promise((resolve) => {
            let selected = 0;

            const showMenu = () => {
                process.stdout.write(UI.cls);
                if (instruction) UI.echo(instruction);
                UI.echo("Use ↑/↓ to navigate, Enter to select:\n");
                options.forEach((option, i) => {
                    if (i === selected) {
                        UI.echo(UI.cyan(UI.cursor + option))
                    } else {
                        UI.echo(UI.white(UI.tab + option))
                    }

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
                    cleanup();
                    resolve("");
                }
            };
            process.stdin.on("keypress", onKey);
        });
    }
    public static ask(question: string): Promise<string> {
        return new Promise((resolve) => {
            const sc = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            sc.question(UI.white(question) + "\n", (answer) => {
                sc.close();
                resolve(answer);
            });
        });
    }

    public static async loopAsk(question: string, validator: (answer: string) => boolean, feedback: string = "Invalid input. Try again."): Promise<string> {
        let answer: string = "";
        do {
            answer = await UI.ask(question);
            if (!validator(answer)) UI.echo(UI.red(feedback));
        } while (!validator(answer));

        return answer;
    }

    public static success(...args: any[]): typeof UI {
        process.stdout.write(UI.green(util.format(...args) + "\n"));
        return this;
    }

    public static warning(...args: any[]): typeof UI {
        process.stdout.write(UI.yellow(util.format(...args) + "\n"));
        return this;
    }

    public static error(...args: any[]): typeof UI {
        process.stdout.write(UI.red(util.format(...args) + "\n"));
        return this;
    }

    public static info(...args: any[]): typeof UI {
        process.stdout.write(UI.cyan(util.format(...args) + "\n"));
        return this;
    }

    public static echo(...args: any[]): typeof UI {
        process.stdout.write(UI.white(util.format(...args) + "\n"));
        return this;
    }
    
    public static exit(code?: string | number): never {
        return process.exit(code);
    }
}

