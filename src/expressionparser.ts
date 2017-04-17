import {UndefinedReferenceError, UnexpectedTokenError, UnknownBuiltinError} from "./exceptions";
import {ASTNode} from "./interfaces/ast";
import {FunctionCallNode, InnerExpressionNode, NumberNode, OperationNode, ReferenceNode} from "./nodes";
import {Token, TOKEN_TYPE, TokenProvider} from "./tokenizer";

const MATH_CONSTANTS = {
    "@pi": 3.14159265359,
};

const MATH_FUNCTIONS = {
    "@sin": "Math.sin",
    "@cos": "Math.cos",
};

export class ExpressionParser {
    private AST: ASTNode;
    private definedConstants: string[];
    private tokens: TokenProvider;

    constructor(tokens: TokenProvider, definedConstants: string[]) {
        this.tokens = tokens;
        this.definedConstants = definedConstants;
        this.AST = this.stage1();
    }

    public getAST(): ASTNode {
        return this.AST;
    }

    private stage1(): ASTNode {
        const token = this.getExpressionStart();

        // Replace constants
        if (token.type === TOKEN_TYPE.BUILTIN && MATH_CONSTANTS[token.value]) {
            token.type = TOKEN_TYPE.NUMBER;
            token.value = MATH_CONSTANTS[token.value];
        } else if (token.type === TOKEN_TYPE.BUILTIN && !MATH_FUNCTIONS[token.value]) {
            throw new UnknownBuiltinError(token);
        }

        if (token.type === TOKEN_TYPE.NUMBER || token.type === TOKEN_TYPE.NAME) {
            const operation = this.getOperation();

            if (token.type === TOKEN_TYPE.NAME && this.definedConstants.indexOf(token.value) < 0) {
                throw new UndefinedReferenceError(token);
            }

            if (operation) {
                this.tokens.next();
                const operationNode = new OperationNode();
                operationNode.value = operation.value;
                operationNode.left = this.valueFromToken(token);
                operationNode.right = this.stage1();
                return operationNode;
            } else {
                return this.valueFromToken(token);
            }
        } else if (token.type === TOKEN_TYPE.BUILTIN) {
            // Function call
            this.tokens.expect(TOKEN_TYPE.LPAREN);
            const expressionNode = this.stage1();
            this.tokens.expect(TOKEN_TYPE.RPAREN);

            const functionCallNode = new FunctionCallNode();
            functionCallNode.function = MATH_FUNCTIONS[token.value];
            functionCallNode.value = expressionNode;

            const operation = this.getOperation();
            if (operation) {
                this.tokens.next();
                const operationNode = new OperationNode();
                operationNode.value = operation.value;
                operationNode.left = functionCallNode;
                operationNode.right = this.stage1();
                return operationNode;
            } else {
                return functionCallNode;
            }
        } else {
            const expressionNode = this.stage1();
            this.tokens.expect(TOKEN_TYPE.RPAREN);

            const operation = this.getOperation();
            if (operation) {
                this.tokens.next();
                const operationNode = new OperationNode();
                operationNode.value = operation.value;
                operationNode.left = new InnerExpressionNode(expressionNode);
                operationNode.right = this.stage1();
                return operationNode;
            } else {
                return new InnerExpressionNode(expressionNode);
            }
        }
    }

    private getOperation(): Token {
        return this.tokens.peekIfEither(TOKEN_TYPE.ADD, TOKEN_TYPE.SUBTRACT,
            TOKEN_TYPE.MULTIPLY, TOKEN_TYPE.DIVIDE);
    }

    private getExpressionStart(): Token {
        return this.tokens.expectEither(TOKEN_TYPE.NUMBER, TOKEN_TYPE.NAME,
            TOKEN_TYPE.LPAREN, TOKEN_TYPE.BUILTIN);
    }

    private valueFromToken(token: Token): ASTNode {
        if (token.type === TOKEN_TYPE.NUMBER) {
            const numberNode = new NumberNode();
            numberNode.value = parseFloat(token.value);
            return numberNode;
        } else if (token.type === TOKEN_TYPE.NAME) {
            const referenceNode = new ReferenceNode();
            referenceNode.value = token.value;
            return referenceNode;
        }

        throw new UnexpectedTokenError(token);
    }
}
