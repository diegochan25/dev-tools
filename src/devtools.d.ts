interface String {
    removePrefix: (prefix: string | RegExp) => string;
    removeSuffix: (suffix: string | RegExp) => string;
    isUpperCase: () => boolean;
    isLowerCase: () => boolean;
    capitalize: () => string;
}

interface NumberConstructor {
    isDigit: (number: string) => boolean;
}
