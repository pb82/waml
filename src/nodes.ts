import {ExpressionWriter} from "./expressionwriter";
import {ArrayWriter} from "./arraywriter";
import {ASTNode, NamedNode} from "./interfaces/ast";
import {JavascriptWriter} from "./jswriter";

export class OperationNode implements ASTNode {
    public left: ASTNode;
    public right: ASTNode;
    public value: string;

    public generateCode(writer: ExpressionWriter) {
        this.left.generateCode(writer);
        writer.writeGeneric(this.value);
        this.right.generateCode(writer);
    }
}

export class NumberNode implements ASTNode {
    public value: number;

    public generateCode(writer: ExpressionWriter): void {
        writer.writeGeneric(this.value);
    }
}

export class ReferenceNode implements ASTNode {
    public value: string;

    public generateCode(writer: ExpressionWriter): void {
        writer.writeGeneric(this.value);
    }
}

export class FunctionCallNode implements ASTNode {
    public function: string;
    public value: ASTNode;

    public generateCode(writer: ExpressionWriter) {
        writer.startFunctoin(this.function);
        this.value.generateCode(writer);
        writer.endFunction();
    }
}

export class InnerExpressionNode implements ASTNode {
    public value: ASTNode;

    constructor(expression: ASTNode) {
        this.value = expression;
    }

    public generateCode(writer: ExpressionWriter): void {
        writer.beginInnerExpression();
        this.value.generateCode(writer);
        writer.endInnerExpression();
    }
}

export class ArrayNode implements ASTNode {
    public items: ASTNode[] = [];

    public generateCode(writer: ArrayWriter): void {
        writer.beginArray();
        const expressionWriter = new ExpressionWriter();
        for (const item of this.items) {
            item.generateCode(expressionWriter);
            writer.writeGeneric(expressionWriter.write());
            writer.writeGeneric(",");
            expressionWriter.reset();
        }
        writer.endArray();
    }
}

export class ArrayExpressionNode implements ASTNode {
    public variable: string;
    public from: ASTNode;
    public to: ASTNode;
    public body: ASTNode;

    public generateCode(writer: ArrayWriter): void {
        const expressionWriter = new ExpressionWriter();

        this.from.generateCode(expressionWriter);
        const from = expressionWriter.write();
        expressionWriter.reset();

        this.to.generateCode(expressionWriter);
        const to = expressionWriter.write();
        expressionWriter.reset();

        this.body.generateCode(expressionWriter);
        const body = expressionWriter.write();

        writer.beginArrayExpression(this.variable);
        writer.writeArrayExpression(this.variable, from, to, body);
        writer.endArrayExpression(this.variable);
    }
}

export class ConstantNode implements NamedNode {
    public METADATA = {
        value: "expression",
    };

    public name: string;
    public value: number;
    public anonymous: boolean = true;

    public generateCode(jswriter: JavascriptWriter): void {
        jswriter.writeConstant(this.name, this.value);
    }
}

export class PeriodicWaveNode implements NamedNode {
    public METADATA = {
        real: "array",
        img: "array",
    };

    public name: string;
    public real: any;
    public img: any;
    public anonymous: boolean = true;

    public generateCode(writer: JavascriptWriter) {
        writer.writeGeneratePeriodicWave(this.name, this.real, this.img);
    }
}

export class OscillatorNode implements NamedNode {
    public METADATA = {
        detune: "expression",
        frequency: "expression",
        type: "string",
        periodicWave: "expression",
    };

    public detune: number = null;
    public exported: boolean = false;
    public frequency: number = 440;
    public name: string = null;
    public type: string = "sine";
    public anonymous: boolean = true;
    public periodicWave: any;

    public generateCode(jswriter: JavascriptWriter): void {
        const name = jswriter.writeDefinition("createOscillator", this.name);
        jswriter.writeGenericProperty(name, "detune", this.detune);
        jswriter.writeGenericProperty(name, "frequency", this.frequency);
        jswriter.writeStringProperty(name, "type", this.type, true);

        if (this.periodicWave) {
            jswriter.writeSetPeriodicWave(this.name, this.periodicWave);
        }

        jswriter.writeStartNode(name);
        if (this.exported && !this.anonymous) {
            jswriter.writeGetterSetter(name, "detune");
            jswriter.writeGetterSetter(name, "frequency");
            jswriter.writeGetterSetter(name, "type", true);
        }
    }
}
