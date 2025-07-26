import { 
    JavaScriptFileNameCasingRule, 
    JavaScriptIndentationRule, 
    JavaScriptModuleSystemRule as JavaScriptModuleSyntaxRule, 
    JavaScriptObjectSpacingRule, 
    JavaScriptPackageManagerRule, 
    JavaScriptQuoteRule, 
    JavaScriptRuntimeRule, 
    JavaScriptSemiColonRule, 
    NestDbSyntaxRule, 
    NestORMRule,
    ReactElementReturnTypeRule,
    ReactLanguageRule
} from "./config-rules";

export interface ConfigProfile {
    javascript: JavaScriptConfig;
    nest: NestConfig;
    react: ReactConfig;
}

export interface JavaScriptConfig {
    quotes: JavaScriptQuoteRule;
    semicolon: JavaScriptSemiColonRule;
    indentation: JavaScriptIndentationRule;
    tabWidth: number;
    objectSpacing: JavaScriptObjectSpacingRule;
    filenameCasing: JavaScriptFileNameCasingRule;
    defaultRuntime: JavaScriptRuntimeRule;
    defaultPackageManager: JavaScriptPackageManagerRule;
    defaultModuleSyntax: JavaScriptModuleSyntaxRule;
}

export interface NestConfig {
    defaultOrm: NestORMRule;
    defaultDbSyntax: NestDbSyntaxRule;
}

export interface ReactConfig {
    defaultLang: ReactLanguageRule;
    defaultElementReturnType: ReactElementReturnTypeRule;
    requireExplicitImport: boolean;
}