import {Writer} from "./interfaces/writer";

export class ArrayWriter implements Writer {
    private expression: string[] = [];

    public beginArrayExpression(variable: string): void {
        this.expression.push(`(function(){var _${variable}=[];`);
    }

    public writeArrayExpression(variable, from, to, body): void {
        const loop = `for(var ${variable}=${from};${variable}<${to};++${variable}){_${variable}.push(${body})}`;
        this.expression.push(loop);
    }

    public endArrayExpression(variable: string): void {
        this.expression.push(`;return _${variable};})();`);
    }

    public beginArray(): void {
        this.expression.push("[");
    }

    public endArray(): void {
        // Remove last separator
        this.expression.pop();
        this.expression.push("]");
    }

    public writeGeneric(generic: any): void {
        this.expression.push(generic);
    }

    public write(): string {
        return this.expression.join("");
    }

    public reset(): void {
        this.expression = [];
    }
}
