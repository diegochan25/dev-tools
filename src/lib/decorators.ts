import { UI } from "@/cli/ui";

export default function abortable(target: object, key: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args: any[]) {
        let running: boolean = true;
        let interrupted: boolean = false;

        const stop = () => interrupted = running;

        process.once("SIGINT", stop);

        try {
            const result = await method.apply(this, args);
            return result;
        } finally {
            running = false;
            process.removeListener("SIGINT", stop);
            if (interrupted) {
                UI.echo(UI.red("Process '" + key + "' interrupted by user."));
                process.exit(1);
            }
        }
    };

    return descriptor;
}