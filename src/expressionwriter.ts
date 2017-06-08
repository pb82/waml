import {Writer} from "./interfaces/writer";

export class ExpressionWriter implements Writer {
    private expression: string[] = [];

    public beginInnerExpression(): void {
        this.expression.push("(");
    }

    public endInnerExpression(): void {
        this.expression.push(")");
    }

    public writeGeneric(generic: any): void {
        this.expression.push(generic);
    }

    public startFunctoin(name: string) {
        this.expression.push(`${name}(`);
    }

    public endFunction() {
        this.endInnerExpression();
    }

    public write(): string {
        return this.expression.join("");
    }

    public reset(): void {
        this.expression = [];
    }
}
