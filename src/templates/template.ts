import { File } from "@lib/file";
import ejs from "ejs";


export class Template { 
    private filepath: string;
    private data: any = {};
    private content: string = "";

    constructor(filepath: string) {
        this.filepath = filepath;
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