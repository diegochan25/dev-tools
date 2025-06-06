import abortable from "@/lib/decorators";
import { HandlerBase } from "./handler-base";

export class NestHandler extends HandlerBase {

    @abortable
    public createProject(): void {
        
    }
}