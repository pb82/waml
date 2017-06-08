import {UnexpectedTokenError} from "./exceptions";

const RX_WHITESPACE = new RegExp("^\\s$");
const RX_NEWLINE = new RegExp("^[\\r\\n]");
const RX_NUMBER = new RegExp("^-?\\d+\\.?\\d*$");

// Definitions
export enum TOKEN_TYPE {
    LPAREN,
    RPAREN,
    LBRACKET,
    RBRACKET,
    LSQUARE,
    RSQUARE,
    COMMA,
    ARROW,
    COLON,
    STRING,
    NUMBER,
    NAME,
    CLASS,
    ADD,
    SUBTRACT,
    MULTIPLY,
    DIVIDE,
    BUILTIN,
}
const QUOTATION_MARK = '"';
const TOKEN_CHAR_MAPPING = {
    "(": TOKEN_TYPE.LPAREN,
    ")": TOKEN_TYPE.RPAREN,
    "{": TOKEN_TYPE.LBRACKET,
    "}": TOKEN_TYPE.RBRACKET,
    "[": TOKEN_TYPE.LSQUARE,
    "]": TOKEN_TYPE.RSQUARE,
    ":": TOKEN_TYPE.COLON,
    ",": TOKEN_TYPE.COMMA,
    ">": TOKEN_TYPE.ARROW,
    "+": TOKEN_TYPE.ADD,
    "-": TOKEN_TYPE.SUBTRACT,
    "*": TOKEN_TYPE.MULTIPLY,
    "/": TOKEN_TYPE.DIVIDE,
};
const TOKEN_CHARS = Object.keys(TOKEN_CHAR_MAPPING);

/**
 * Base information that every token must hold:
 * The line where it was encountered, the index
 * where it was encountered and the actual value.
 * The `type` property will be determined in the
 * analyze part
 */
export class Token {
    public line: number;
    public index: number;
    public value: string;
    public type: TOKEN_TYPE;

    constructor(line: number, index: number, value: string) {
        this.line = line;
        this.index = index;
        this.value = value;
    }
}

/**
 * Provides convenient access for the parser to the token array
 * and also has some methods to check the current status of the
 * token stream
 */
export class TokenProvider {
    private tokens: Token[];
    private index: number = 0;
    private indexStack: number[] = [];

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    public hasNext() {
        return this.index < this.tokens.length;
    }

    public next(): Token {
        if (!this.hasNext()) {
            throw new Error("no more tokens");
        }
        return this.tokens[this.index++];
    }

    public peek(): Token {
        return this.tokens[this.index];
    }

    public peekIf(type: TOKEN_TYPE): Token {
        const token = this.tokens[this.index];
        if (token && token.type === type) {
            return token;
        }
        return null;
    }

    public peekIfEither(...types: TOKEN_TYPE[]): Token {
        const token = this.tokens[this.index];
        if (token && types.indexOf(token.type) >= 0) {
            return token;
        }
        return null;
    }

    public peekAhead(lookahead: number): Token {
        return this.tokens[this.index + lookahead];
    }

    public expect(type: TOKEN_TYPE): Token {
        const token = this.next();
        if (token.type === type) {
            return token;
        }
        throw new UnexpectedTokenError(token);
    }

    public expectEither(...types: TOKEN_TYPE[]) {
        const token = this.next();
        if (types.indexOf(token.type) >= 0) {
            return token;
        }
        throw new UnexpectedTokenError(token);
    }

    public pushState(): void {
        this.indexStack.push(this.index);
    }

    public restoreState(): void {
        if (this.indexStack.length === 0) {
            throw new Error("Parse index corruption");
        }

        this.index = this.indexStack.pop();
    }
}

/**
 * Classifies tokens by the shape of their value and sets the
 * `type` property of the Token class. It can distinguish between strings,
 * numbers, control characters, classes (Uppercoase IDs) and names (lowercase IDs)
 */
export class Analyzer {
    private rawTokens: Token[];

    constructor(rawTokens: Token[]) {
        this.rawTokens = rawTokens;
        this.run();
    }

    public getTokens(): Token[] {
        return this.rawTokens;
    }

    private run() {
        this.rawTokens = this.rawTokens.map((token) => {
            if (token.type) {
                return token;
            }
            if (TOKEN_CHARS.indexOf(token.value) >= 0) {
                token.type = TOKEN_CHAR_MAPPING[token.value];
            } else if (RX_NUMBER.test(token.value)) {
                token.type = TOKEN_TYPE.NUMBER;
            } else {
                // Uppercase identifiers are classes, lowercase ones
                // are names and identifiers that start with @ are
                // built-ins
                const firstChar = token.value[0];
                if (firstChar === "@") {
                    token.type = TOKEN_TYPE.BUILTIN;
                } else if (firstChar === firstChar.toUpperCase()) {
                    token.type = TOKEN_TYPE.CLASS;
                } else {
                    token.type = TOKEN_TYPE.NAME;
                }
            }
            return token;
        });
    }
}

/**
 * The Tokenizer will take a string input and break it down into
 * tokens that can be further analzyed.
 */
export class Tokenizer {
    private source: string;
    private tokens: Token[] = [];
    private currentLine: number = 1;
    private currentIndex: number = 0;
    private currentToken: string = "";
    private currentString: string = "";

    constructor(source: string) {
        this.source = source;
        this.run();
    }

    public getTokens(): Token[] {
        return this.tokens;
    }

    private run() {
        let insideString: boolean = false;
        for (const char of this.source) {
            // String handling
            if (char === QUOTATION_MARK && !insideString) {
                insideString = true;
                this.currentIndex++;
                continue;
            } else if (char === QUOTATION_MARK && insideString) {
                this.pushString();
                insideString = false;
                continue;
            } else if (insideString && RX_NEWLINE.test(char)) {
                this.currentIndex = 0;
                this.currentLine++;
                continue;
            } else if (insideString) {
                this.currentString += char;
                this.currentIndex++;
                continue;
            }

            // Non-string handling
            if (RX_NEWLINE.test(char)) {
                // Newline: push token, increase line count and reset index
                this.pushToken();
                this.currentLine++;
                this.currentIndex = 0;
            } else if (RX_WHITESPACE.test(char)) {
                // Whitespace: token separator, increase index
                this.pushToken();
                this.currentIndex++;
            } else if (TOKEN_CHARS.indexOf(char) >= 0) {
                // Terminator char: push token and terminator
                this.pushToken();
                this.currentToken = char;
                this.currentIndex++;
                this.pushToken();
            } else {
                // Character: append to the current char value
                this.currentToken += char;
                this.currentIndex++;
            }
        }
        // It's not required that the source ends with a newline or a
        // whitespace char, so there might still be an unterminated
        // token
        this.pushToken();
    }

    private pushString() {
        if (this.currentString) {
            const token = new Token(this.currentLine, this.currentIndex, this.currentString);
            token.type = TOKEN_TYPE.STRING;
            this.tokens.push(token);
            this.currentString = "";
        }
    }

    private pushToken() {
        if (this.currentToken) {
            const token = new Token(this.currentLine, this.currentIndex, this.currentToken);
            this.tokens.push(token);
            this.currentToken = "";
        }
    }
}
