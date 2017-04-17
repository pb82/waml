import {Generator} from "./generator";
import {Parser} from "./parser";
import {Analyzer, Tokenizer, TokenProvider} from "./tokenizer";

export function compile(source) {
    const tokenizer = new Tokenizer(source);
    const analyzer = new Analyzer(tokenizer.getTokens());
    const tokenProvider = new TokenProvider(analyzer.getTokens());
    const parser = new Parser(tokenProvider);
    const generator = new Generator(parser.getAST());
    console.log(generator.generate());
}
