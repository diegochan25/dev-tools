import { CaseMap } from "./case-map";

export class CaseConverter {
    private words: string[];

    constructor(input: string) {
        this.words = CaseConverter.splitIntoWords(input);
    }

    public convert(): CaseMap {
        return {
            camel: this.toCamelCase(),
            pascal: this.toPascalCase(),
            snake: this.toSnakeCase(),
            upper: this.toUpperCase(),
            kebab: this.toKebabCase(),
            spaced: this.toSpacedCase(),
        } satisfies CaseMap;
    }

    private static splitIntoWords(input: string): string[] {
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

    private toCamelCase(): string {
        return this.words
            .map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1))
            .join("");
    }

    private toPascalCase(): string {
        return this.words
            .map(w => w[0].toUpperCase() + w.slice(1))
            .join("");
    }

    private toSnakeCase(): string {
        return this.words.join("_");
    }

    private toUpperCase(): string {
        return this.words.join("_").toUpperCase();
    }

    private toKebabCase(): string {
        return this.words.join("-");
    }

    private toSpacedCase(): string {
        return this.words.join(" ");
    }
}


