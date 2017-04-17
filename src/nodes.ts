import {ExpressionWriter} from "./expressionwriter";
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

export class OscillatorNode implements NamedNode {
    public METADATA = {
        detune: "expression",
        frequency: "expression",
        type: "string",
    };

    public detune: number = null;
    public exported: boolean = false;
    public frequency: number = 440;
    public name: string = null;
    public type: string = "sine";
    public anonymous: boolean = true;

    public generateCode(jswriter: JavascriptWriter): void {
        const name = jswriter.writeDefinition("OscillatorNode", this.name);
        jswriter.writeGenericProperty(name, "detune", this.detune);
        jswriter.writeGenericProperty(name, "frequency", this.frequency);
        jswriter.writeStringProperty(name, "type", this.type, true);
        jswriter.writeStartNode(name);
        if (this.exported && !this.anonymous) {
            jswriter.writeGetterSetter(name, "detune");
            jswriter.writeGetterSetter(name, "frequency");
            jswriter.writeGetterSetter(name, "type", true);
        }
    }
}
