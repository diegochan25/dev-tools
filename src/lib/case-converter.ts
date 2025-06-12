import { CaseMap } from "../types/case-map";

export class CaseConverter {
    public static convert(input: string): CaseMap {
        const words: string[] = this.toStringArray(input)
        return {
            camel: this.toCamelCase(words),
            pascal: this.toPascalCase(words),
            snake: this.toSnakeCase(words),
            upper: this.toUpperCase(words),
            kebab: this.toKebabCase(words),
            spaced: this.toSpacedCase(words),
        } satisfies CaseMap;
    }

    private static toStringArray(input: string): string[] {
        const normalized = input
            .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2") 
            .replace(/[_\-\s]+/g, " ")
            .trim();

        return normalized
            .split(" ")
            .filter(w => w.length > 0)
            .map(w => w.toLowerCase());
    }

    private static toCamelCase(words: string[]): string {
        return words
            .map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1))
            .join("");
    }

    private static toPascalCase(words: string[]): string {
        return words
            .map(w => w[0].toUpperCase() + w.slice(1))
            .join("");
    }

    private static toSnakeCase(words: string[]): string {
        return words.join("_");
    }

    private static toUpperCase(words: string[]): string {
        return words.join("_").toUpperCase();
    }

    private static toKebabCase(words: string[]): string {
        return words.join("-");
    }

    private static toSpacedCase(words: string[]): string {
        return words.join(" ");
    }
}


