export class TraverseError extends Error {

    public static readonly TRAVERSE_ERROR_BASE: number = 0;
    public static readonly REACHED_END_OF_TREE: number = 1;

    public code: number;
    
    constructor();
    constructor(message: string);
    constructor(message: string, code: number);
    constructor(message?: string, code?: number) {
        super(message);
        this.name = "TraverseError";
        this.code = code ?? TraverseError.TRAVERSE_ERROR_BASE;
    }
}