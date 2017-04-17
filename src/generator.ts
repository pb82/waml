import {JavascriptWriter} from "./jswriter";
import {ASTNode} from "./interfaces/ast";

const AUDIO_CTX = "audioCtx";

export class Generator {
    private jswriter: JavascriptWriter = new JavascriptWriter(AUDIO_CTX);
    private AST: ASTNode[];

    constructor(AST: ASTNode[]) {
        this.AST = AST;
    }

    public generate(): string {
        for (const node of this.AST) {
            node.generateCode(this.jswriter);
        }
        return this.jswriter.write();
    }
}