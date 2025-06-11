export interface NestModuleDecorator {
    imports: string[];
    controllers: string[];
    providers: string[];
    exports: string[];
}