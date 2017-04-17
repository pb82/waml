import {format} from "util";
import {Writer} from "./interfaces/writer";

export class JavascriptWriter implements Writer {
    private code: string[] = [];
    private ctx: string = null;
    private typesUsed: {} = {};

    constructor(ctx: string) {
        this.ctx = ctx;
    }

    public generateName(type: string): string {
        if (!this.typesUsed[type]) {
            this.typesUsed[type] = 1;
        }

        return `__${type}_${this.typesUsed[type]++}`;
    }

    public writeDefinition(type: string, name: string): string {
        if (!name) {
            name = this.generateName(type);
        }
        const code = `var ${name}=new ${this.ctx}[${type}]();`;
        this.code.push(code);
        return name;
    }

    public writeGetterSetter(parent: string, prop: string, direct: boolean = false): void {
        let valueParam = ".value";
        if (direct) {
            valueParam = "";
        }

        const code = `this.set_${parent}_${prop}=function(v){${parent}.${prop}${valueParam}=v;};
            this.get_${parent}_${prop}=function(){return ${parent}.${prop}${valueParam};};`;
        this.code.push(code);
    }

    public writeStartNode(node: string): void {
        const code = `${node}.start();`;
        this.code.push(code);
    }

    public writeConstant(name: string, value: any): void {
        const constant = `var ${name}=${value};`;
        this.code.push(constant);
    }

    public writeStringProperty(parent: string, prop: string, value: string, direct: boolean = false): void {
        const valueParam = (direct && ".value") || "";
        const property = `${parent}.${prop}${valueParam}="${value}";`;
        this.code.push(property);
    }

    public writeGenericProperty(parent: string, prop: string, value: any, direct: boolean = false): void {
        const valueParam = (direct && ".value") || "";
        const property = `${parent}.${prop}${valueParam}=${value};`;
        this.code.push(property);
    }

    public write(): string {
        const boilerplate = this.generateBoilerplate();
        return format(boilerplate, this.code.join(""));
    }

    private generateBoilerplate(): string {
        return `
        (function(){
            var ${this.ctx}=new (window.AudioContext || window.webkitAudioContext)();
            %s
        });
        `;
    }
}