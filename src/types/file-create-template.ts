import { Mode } from "./mode";

export interface FileModifyTemplate {
    filename: string;
    template: string;
    mode: Mode;
}