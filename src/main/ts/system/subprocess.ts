import { spawn, execFile, SpawnOptions, ExecFileOptions } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export class Subprocess {
    private command: string;
    private args: string[];
    private options: SpawnOptions;
    private out: string;
    private err: string;
    private statusCode: number | null;

    constructor(args: string[] = [], options: SpawnOptions = {}) {
        if (args.length < 1) {
            throw new TypeError("No command provided");
        }
        this.command = args[0];
        this.args = args.slice(1) || [];
        this.options = { cwd: process.cwd(), ...options };
        this.out = "";
        this.err = "";
        this.statusCode = null;
    }

    public cwd(cwd: string): this {
        this.options.cwd = cwd;
        return this;
    }

    public async run(): Promise<this> {
        return new Promise<this>((resolve, reject) => {
            const child = spawn(this.command, this.args, {
                ...this.options,
                stdio: "pipe",
            });

            const stdoutChunks: Buffer[] = [];
            const stderrChunks: Buffer[] = [];

            child.stdout?.on("data", (chunk) => stdoutChunks.push(chunk));
            child.stderr?.on("data", (chunk) => stderrChunks.push(chunk));

            child.on("close", (code) => {
                this.out = Buffer.concat(stdoutChunks).toString("utf-8");
                this.err = Buffer.concat(stderrChunks).toString("utf-8");
                this.statusCode = code;
                resolve(this);
            });

            child.on("error", (err) => {
                reject(err);
            });
        });
    }

    public stdout(): string {
        return this.out;
    }

    public stderr(): string {
        return this.err;
    }

    public status(): number | null {
        return this.statusCode;
    }

    public static async exec(file: string, args: string[] = [], options: ExecFileOptions = {}): Promise<string> {
        const { stdout } = await execFileAsync(file, args, { encoding: "utf-8", ...options });
        return stdout.toString();
    }
}
