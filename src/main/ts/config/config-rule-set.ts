export interface ConfigRuleSet {
    javascript: JavaScriptRuleSet;
    nest: NestRuleSet;
    react: ReactRuleSet;
}

export interface JavaScriptRuleSet {
    quote: string;
    semicolon: string;
    indent: string;
    objectSpace: string;
    fileNameCaseConverter: (name: string) => string;
    moduleImporter: (modules: string[], path: string, _default: boolean) => string;
}

export interface NestRuleSet {

}

export interface ReactRuleSet {
    componentReturnType: string;
}