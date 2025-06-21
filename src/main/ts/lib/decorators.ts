import { UI } from "@/cli/ui";
import { AnyErrorConstructor } from "@/types";

export function abortable(_: object, key: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
        const controller = new AbortController();
        const { signal } = controller;

        const stop = () => {
            UI.error("Process '" + key + "' interrupted by user.");
            controller.abort();
        };

        process.once("SIGINT", stop);

        try {
            const result = await method.apply(this, [...args, signal]);
            return result;
        } finally {
            process.removeListener("SIGINT", stop);
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
                throw new Error("Expected Map<string, Primitive>. but got '" + argMap.constructor.name + "'.");
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

export function throws(...exceptions: AnyErrorConstructor[]) {
    return function (_: object, key: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = function (...args: any[]) {
            try {
                return method.apply(this, args);
            } catch (error: any) {
                const e = exceptions.find((e) => error instanceof e);
                if (e) {
                    UI.error("Unexpected error of type '%s': %s", e.name, error.message).exit(1);
                } else {
                    throw error;
                }
            }
        }

        return descriptor;
    }
}