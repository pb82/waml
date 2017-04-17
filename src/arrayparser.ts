import {ASTNode} from "./interfaces/ast";
import {TokenProvider} from "./tokenizer";

export class ArrayParser {
    private tokens: TokenProvider;
    private AST: ASTNode;

    constructor(tokens: TokenProvider) {
        this.tokens = tokens;
        this.AST = this.stage1();
    }

    public getAST(): ASTNode {
        return this.AST;
    }

    private stage1(): ASTNode {
        return null;
    }
}
