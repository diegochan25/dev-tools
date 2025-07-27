import { UI } from "@/cli/ui";
import { AnyErrorConstructor } from "@/types";


export function abortable(_: object, key: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args: any[]) {
        const controller = new AbortController();
        const { signal } = controller;

        const stop = () => {
            controller.abort();
            UI.error("\u001b[2K\u001b[0GProcess '%s' interrupted by user.", key).exit(1);
        };

        process.once("SIGINT", stop);

        try { 
            const result = await method.apply(this, [...args, signal]);
            return result;
        } finally {
            process.removeListener("SIGINT", stop);
        }
    }

    return descriptor;
}


export function requires(...properties: string[]) {
    return function (_: object, key: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const [argMap] = args;

            if (!(argMap instanceof Map)) {
                const type = typeof argMap === "object" ? argMap.constructor.name : typeof argMap;
                UI.error("Error (at '%s'): Expected Map<string, Primitive>. but got '%s'", key, type).exit(1);
            }

            properties.forEach((property) => {
                if (!argMap.has(property)) {
                    UI.error("Error (at '%s'): Please provide a value for the required argument '%s'", key, property).exit(1);
                }
            });

            return method.apply(this, args);
        };

        return descriptor;
    };
}

export function throws(...exceptions: AnyErrorConstructor[]) {
    return function (_: object, key: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = function (...args: any[]) {
            try {
                return method.apply(this, args);
            } catch (error: any) {
                const e = exceptions.find((e) => error instanceof e);
                if (e) {
                    UI.error("Error (at '%s'): Unexpected error of type '%s': %s", key, e.name, error.message).exit(1);
                } else {
                    throw error;
                }
            }
        }

        return descriptor;
    }
}