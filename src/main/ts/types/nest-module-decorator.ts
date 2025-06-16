export interface NestModuleDecorator {
    moduleImports: string[];
    imports: string[];
    controllers: string[];
    providers: string[];
    exports: string[];
}