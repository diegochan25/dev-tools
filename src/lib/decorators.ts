import { UI } from "@/cli/ui";

export function abortable(_: object, key: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
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

export function requires(...properties: string[]) {
    return function (_: object, key: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const [argMap] = args;

            if (!(argMap instanceof Map)) {
                throw new Error(`Invalid arguments passed to handler method '${key}'. Expected Map<string, any>.`);
            }

            properties.forEach((property) => {
                if (!argMap.has(property)) {
                    throw new Error(`Required property '${property}' missing on handler method '${key}'.`);
                }
            })

            return method.apply(this, args);
        };

        return descriptor;
    };
}
