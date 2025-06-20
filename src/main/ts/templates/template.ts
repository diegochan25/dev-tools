import { File } from "@/system/file";
import ejs from "ejs";
import path from "path";


export class Template { 
    private filepath: string;
    private data: any = {};
    private content: string = "";

    constructor(...paths: string[]) {
        this.filepath = path.join(...paths);
    }

    public pass(data: Record<string, any>): Template {
        this.data = data;
        return this;
    }

    public render(): Template {
        const template: string = new File(this.filepath).read().text();
        this.content = ejs.render(template, this.data);
        return this;
    }

    public text(): string {
        return this.content;
    }

    public lines(): string[] {
        return this.content.split("\n");
    }
}