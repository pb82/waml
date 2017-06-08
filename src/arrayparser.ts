import {ExpressionParser} from "./expressionparser";
import {ASTNode} from "./interfaces/ast";
import {ArrayNode} from "./nodes";
import {TOKEN_TYPE, TokenProvider} from "./tokenizer";

export class ArrayParser {
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
        this.tokens.expect(TOKEN_TYPE.LSQUARE);

        const array: ArrayNode = new ArrayNode();

        // Empty array
        if (this.tokens.peekIf(TOKEN_TYPE.RSQUARE)) {
            return;
        }

        while (true) {
            const expression = this.readExpression();
            array.items.push(expression);

            if (!this.tokens.peekIf(TOKEN_TYPE.COMMA)) {
                break;
            }
            this.tokens.expect(TOKEN_TYPE.COMMA);
        }

        this.tokens.expect(TOKEN_TYPE.RSQUARE);
        return array;
    }

    private readExpression(): ASTNode {
        const expressionParser = new ExpressionParser(this.tokens, this.definedConstants);
        return expressionParser.getAST();
    }
}
