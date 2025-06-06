import { spawnSync, execFileSync, SpawnSyncOptions, ExecFileSyncOptions } from "child_process";

export class Subprocess {
    private command: string;
    private args: string[];
    private options: SpawnSyncOptions | ExecFileSyncOptions;
    private out: string;
    private err: string;
    private statusCode: number | null;
    constructor(args: string[] = [], options: SpawnSyncOptions = {}) {
        if(args.length < 1) {
            throw new TypeError("No command provided");
        }
        this.command = args[0];
        this.args = args.slice(1) || [];
        this.options = { encoding: "utf-8", ...options };
        this.out = "";
        this.err = "";
        this.statusCode = null;
    }

    public cwd(cwd: string): this {
        this.options.cwd = cwd;
        return this;
    }

    public run(): this {
        const result = spawnSync(this.command, this.args, this.options);

        this.out = (result.stdout || "").toString();
        this.err = (result.stderr || "").toString();
        this.statusCode = result.status;

        if (result.error) {
            throw result.error;
        }

        return this;
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

    public static exec(file: string, args: string[] = [], options: ExecFileSyncOptions = {}): string {
        return execFileSync(file, args, { encoding: "utf-8", ...options }).toString();
    }
}