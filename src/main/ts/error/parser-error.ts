export class ParserError extends Error {

    public static readonly PARSER_ERROR_BASE: number = 0;
    public static readonly REACHED_END_OF_TREE: number = 1;
    public static readonly MISSING_REQUIRED_ARGUMENT: number = 2;
    public static readonly MISSING_ARGUMENT_VALUE: number = 3;
    public static readonly INVALID_OPTION: number = 4;

    public code: number;
    
    constructor();
    constructor(message: string);
    constructor(message: string, code: number);
    constructor(message?: string, code?: number) {
        super(message);
        this.name = "ParserError";
        this.code = code ?? ParserError.PARSER_ERROR_BASE;
    }
}