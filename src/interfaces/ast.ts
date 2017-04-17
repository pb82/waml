import {Writer} from "./writer";

export interface ASTNode {
    generateCode(jswriter: Writer): void;
}

export interface NamedNode extends ASTNode {
    name: string;
    anonymous: boolean;
    METADATA: {};
}
