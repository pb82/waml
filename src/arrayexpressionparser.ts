import {ExpressionParser} from "./expressionparser";
import {ASTNode} from "./interfaces/ast";
import {ArrayExpressionNode} from "./nodes";
import {TOKEN_TYPE, TokenProvider} from "./tokenizer";
import {UnexpectedTokenError} from "./exceptions";

export class ArrayExpressionParser {
    private tokens: TokenProvider;
    private AST: ASTNode;
    private definedConstants: string[];

    constructor(tokens: TokenProvider, definedConstants: string[]) {
        this.definedConstants = definedConstants;
        this.tokens = tokens;
        this.AST = this.stage1();
    }

    public getAST(): ASTNode {
        return this.AST;
    }

    private stage1(): ASTNode {
        const node: ArrayExpressionNode = new ArrayExpressionNode();

        this.tokens.expect(TOKEN_TYPE.LSQUARE);

        node.variable = this.tokens.expect(TOKEN_TYPE.NAME).value;

        this.tokens.expect(TOKEN_TYPE.COMMA);

        node.from = this.readExpression(node.variable);

        const to = this.tokens.expect(TOKEN_TYPE.NAME);
        if (to.value !== "to") {
            throw new UnexpectedTokenError(to);
        }

        node.to = this.readExpression(node.variable);

        this.tokens.expect(TOKEN_TYPE.COMMA);
        node.body = this.readExpression(node.variable);

        this.tokens.expect(TOKEN_TYPE.RSQUARE);
        return node;
    }

    private readExpression(inlineVariable: string): ASTNode {
        let inlineDefinitions = [inlineVariable];
        inlineDefinitions = inlineDefinitions.concat(this.definedConstants);

        inlineDefinitions.concat(this.definedConstants);
        const expressionParser = new ExpressionParser(this.tokens, inlineDefinitions);
        return expressionParser.getAST();
    }
}
