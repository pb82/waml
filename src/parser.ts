import {AlreadyDefinedError, AnonymousExportError, UnexpectedTokenError, UnknownPropertyError} from "./exceptions";
import {ExpressionParser} from "./expressionparser";
import {ExpressionWriter} from "./expressionwriter";
import {ASTNode, NamedNode} from "./interfaces/ast";
import {ConstantNode, OscillatorNode} from "./nodes";
import {TOKEN_TYPE, TokenProvider} from "./tokenizer";

const Keywords = {
    export: "export",
};

const Constructors = {
    Oscillator: OscillatorNode,
    Constant: ConstantNode,
};

export class Parser {
    private tokens: TokenProvider;
    private AST: ASTNode[] = [];
    private definitions: string[] = [];

    constructor(tokens: TokenProvider) {
        this.tokens = tokens;
        while (this.tokens.hasNext()) {
            this.AST.push(this.stageOne());
        }
    }

    public getAST(): ASTNode[] {
        return this.AST;
    }

    private parsePropertyList(target: NamedNode): void {
        this.tokens.expect(TOKEN_TYPE.LBRACKET);

        // Empty property lists are allowed
        if (this.tokens.peek().type === TOKEN_TYPE.RBRACKET) {
            this.tokens.next();
            return;
        }

        const instanceProps = Object.getOwnPropertyNames(target.METADATA);
        while (true) {
            // Check if the property is known to the object
            const propertyName = this.tokens.expect(TOKEN_TYPE.NAME);
            if (instanceProps.indexOf(propertyName.value) < 0) {
                throw new UnknownPropertyError(propertyName);
            }

            // Value can be either a string, a number or a name (reference)
            // TODO: allow inline definitions
            this.tokens.expect(TOKEN_TYPE.COLON);
            if (target.METADATA[propertyName.value] === "string") {
                target[propertyName.value] = this.tokens.expect(TOKEN_TYPE.STRING).value;
            } else {
                target[propertyName.value] = this.readExpression(this.definitions);
            }

            // Another property?
            if (this.tokens.peek().type !== TOKEN_TYPE.COMMA) {
                break;
            }
            this.tokens.expect(TOKEN_TYPE.COMMA);
        }

        this.tokens.expect(TOKEN_TYPE.RBRACKET);
    }

    /**
     * Parses object definitions in the form of
     * <Class> [name] {
     *      <Property>: <Value>,
     *      ...
     * }
     * @returns {ASTNode}
     */
    private parseDefinition(): ASTNode {
        const type = this.tokens.expect(TOKEN_TYPE.CLASS);
        const Constructor = Constructors[type.value];
        const instance = new Constructor();
        let definedName = null;

        if (this.tokens.peek().type === TOKEN_TYPE.NAME) {
            const name = this.tokens.expect(TOKEN_TYPE.NAME);
            if (this.definitions.indexOf(name.value) >= 0) {
                throw new AlreadyDefinedError(name);
            }
            instance.name = name.value;
            instance.anonymous = false;
            definedName = name.value;
        }

        this.parsePropertyList(instance);

        const isExport = this.tokens.peekIf(TOKEN_TYPE.NAME);
        if (isExport && isExport.value === Keywords.export) {
            if (instance.anonymous) {
                throw new AnonymousExportError(type);
            }

            this.tokens.next();
            instance.exported = true;
        }

        // Only push the name to the known definitions after the whole thing
        // is parsed to prevent self referential definitions
        if (definedName) {
            this.definitions.push(definedName);
        }

        return instance;
    }

    private readExpression(definedConstants: string[]): string {
        const expressionParser = new ExpressionParser(this.tokens, definedConstants);
        const expressionWriter = new ExpressionWriter();
        expressionParser.getAST().generateCode(expressionWriter);
        return expressionWriter.write();
    }

    private stageOne(): ASTNode {
        const token = this.tokens.peek();
        switch (token.type) {
            case TOKEN_TYPE.CLASS:
                return this.parseDefinition();
            default:
                throw new UnexpectedTokenError(token);
        }
    }
}
