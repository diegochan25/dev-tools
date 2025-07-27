import { ConfigProfile, 
    JavaScriptConfig, 
    NestConfig, 
    ReactConfig 
} from "./config-profile";

import { 
    JavaScriptFileNameCasingRule, 
    JavaScriptIndentationRule, 
    JavaScriptModuleSystemRule, 
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

export const DEFAULT_CONFIG = Object.freeze({
    javascript: {
        quotes: JavaScriptQuoteRule.Double,
        semicolon: JavaScriptSemiColonRule.Use,
        indentation: JavaScriptIndentationRule.Space,
        tabWidth: 4,
        objectSpacing: JavaScriptObjectSpacingRule.Space,
        filenameCasing: JavaScriptFileNameCasingRule.Kebab,
        defaultRuntime: JavaScriptRuntimeRule.Bun,
        defaultPackageManager: JavaScriptPackageManagerRule.Bun,
        defaultModuleSyntax: JavaScriptModuleSystemRule.ES6
    } satisfies JavaScriptConfig,
    nest: {
        defaultOrm: NestORMRule.TypeOrm,
        defaultDbSyntax: NestDbSyntaxRule.MongoDB,
        defaultDataSource: "DATA_SOURCE"
    } satisfies NestConfig,
    react: {
        defaultLang: ReactLanguageRule.JSX,
        defaultElementReturnType: ReactElementReturnTypeRule.JSXElement,
        requireExplicitImport: true,
    } satisfies ReactConfig
} satisfies ConfigProfile);