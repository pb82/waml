export class UnexpectedTokenError extends Error {
    constructor(token) {
        const index = token.index - token.value.length;
        super(`Unexpected token '${token.value}' at ${token.line}:${index}`);
    }
}

export class UnknownPropertyError extends Error {
    constructor(token) {
        const index = token.index - token.value.length;
        super(`Unknown property '${token.value}' at ${token.line}:${index}`);
    }
}

export class UnknownBuiltinError extends Error {
    constructor(token) {
        const index = token.index - token.value.length;
        super(`Unknown builtin '${token.value}' at ${token.line}:${index}`);
    }
}

export class AlreadyDefinedError extends Error {
    constructor(token) {
        const index = token.index - token.value.length;
        super(`Object '${token.value}' at ${token.line}:${index} is already defined`);
    }
}

export class UndefinedReferenceError extends Error {
    constructor(token) {
        const index = token.index - token.value.length;
        super(`Undefined reference '${token.value}' at ${token.line}:${index}`);
    }
}

export class AnonymousExportError extends Error {
    constructor(token) {
        const index = token.index - token.value.length;
        super(`Cannot export anynymous object ${token.value} at ${token.line}:${index}`);
    }
}
