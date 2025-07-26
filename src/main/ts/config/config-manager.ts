import path from "path";
import { ConfigProfile } from "./config-profile";
import { File } from "@system/file";
import { strings } from "@resources/strings";
import { DEFAULT_CONFIG } from "./default-config";
import { ConfigRuleSet, JavaScriptRuleSet, NestRuleSet, ReactRuleSet } from "./config-rule-set";
import { JavaScriptFileNameCasingRule, JavaScriptIndentationRule, JavaScriptModuleSystemRule, JavaScriptObjectSpacingRule, JavaScriptQuoteRule, JavaScriptSemiColonRule, ReactElementReturnTypeRule } from "./config-rules";
import { CaseConverter } from "@/lib/case-converter";

export class ConfigManager {
    public static getConfigProfile(): ConfigProfile {
        const config = new File(path.join(strings.ROOT_DIR, "config.json"));
        if (!config.exists) config.ensure().writeJson(DEFAULT_CONFIG);
        return config.read().json<ConfigProfile>()!;
    }

    public static createRuleSet(): ConfigRuleSet {
        const config: ConfigProfile = this.getConfigProfile();
        const rules = {
            javascript: {
                quote: "",
                semicolon: "",
                indent: "",
                objectSpace: "",
                fileNameCaseConverter: (name: string) => "",
                moduleImporter: (modules: string[], path: string, _default: boolean) => "",
            } satisfies JavaScriptRuleSet,
            nest: {} satisfies NestRuleSet,
            react: {
                componentReturnType: ""
            } satisfies ReactRuleSet
        } satisfies ConfigRuleSet;

        // JavaScript
        switch (config.javascript.quotes) {
            case JavaScriptQuoteRule.Single:
                rules.javascript.quote = "'";
                break;
            case JavaScriptQuoteRule.Double:
                rules.javascript.quote = '"';
                break;
        }

        switch (config.javascript.semicolon) {
            case JavaScriptSemiColonRule.Use:
                rules.javascript.semicolon = ";";
                break;
            case JavaScriptSemiColonRule.Omit:
                rules.javascript.semicolon = "";
                break;
        }

        switch (config.javascript.indentation) {
            case JavaScriptIndentationRule.Tab:
                rules.javascript.indent = "\t";
                break;
            case JavaScriptIndentationRule.Space:
                rules.javascript.indent = " ".repeat(config.javascript.tabWidth);
                break;
        }

        switch (config.javascript.objectSpacing) {
            case JavaScriptObjectSpacingRule.Space:
                rules.javascript.objectSpace = " ";
                break;
            case JavaScriptObjectSpacingRule.Tight:
                rules.javascript.objectSpace = "";
                break;
        }

        switch (config.javascript.filenameCasing) {
            case JavaScriptFileNameCasingRule.Pascal:
                rules.javascript.fileNameCaseConverter = (name: string) => CaseConverter.convert(name).pascal;
                break;
            case JavaScriptFileNameCasingRule.Kebab:
                rules.javascript.fileNameCaseConverter = (name: string) => CaseConverter.convert(name).kebab;
                break;
        }

        switch (config.javascript.defaultModuleSyntax) {
            case JavaScriptModuleSystemRule.CommonJS:
                rules.javascript.moduleImporter = (modules: string[], path: string, _default: boolean = false) => {
                    return _default ? 
                        `const ${modules.map((m) => m.split(" ").filter((w) => w.trim() !== "as").join(": ")).join(", ")} = require(${rules.javascript.quote}${path}${rules.javascript.quote})${rules.javascript.semicolon}` : 
                        `const {${rules.javascript.objectSpace}${modules.map((m) => m.split(" ").filter((w) => w.trim() !== "as").join(": ")).join(", ")}${rules.javascript.objectSpace}} = require(${rules.javascript.quote}${path}${rules.javascript.quote})${rules.javascript.semicolon}`;
                }
                break;
            case JavaScriptModuleSystemRule.ES6:
                rules.javascript.moduleImporter = (modules: string[], path: string, _default: boolean = false) => {
                    return _default ? 
                        `import ${modules.join(", ")} from ${rules.javascript.quote}${path}${rules.javascript.quote}${rules.javascript.semicolon}`
                        :
                        `import {${rules.javascript.objectSpace}${modules.join(", ")}${rules.javascript.objectSpace}} from ${rules.javascript.quote}${path}${rules.javascript.quote}${rules.javascript.semicolon}`
                }
                break;
        }

        // React
        switch (config.react.defaultElementReturnType) {
            case ReactElementReturnTypeRule.ReactNode:
                rules.react.componentReturnType = config.react.requireExplicitImport ? "React.ReactNode" : "ReactNode";
                break;
            case ReactElementReturnTypeRule.JSXElement:
                rules.react.componentReturnType = config.react.requireExplicitImport ? "React.JSX.Element" : "JSX.Element";
                break;
        }

        return rules;
    }
}