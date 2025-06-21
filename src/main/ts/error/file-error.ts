export class FileError extends Error {
    public static readonly FILE_ERROR_BASE: number = 0;
    public code: number;


    constructor()
    constructor(message: string);
    constructor(message: string, code: number);
    constructor(message?: string, code?: number) {
        super(message);
        this.name = "FileError";
        this.code = code ?? FileError.FILE_ERROR_BASE;
    }
}
