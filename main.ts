import * as Promise from "bluebird";
import * as program from "commander";
import {readFile} from "fs";
import {join} from "path";
import {error, info} from "./logger";
import {compile} from "./src/compiler";

function readPackageJson(): Promise<any> {
    return new Promise((resolve, reject) => {
        readFile(join(".", "package.json"), (err, data) => {
            if (err) {
                return reject(err);
            }
            data = JSON.parse(data.toString("utf-8"));
            return resolve(data);
        });
    });
}

function readFromStream(stream): Promise<any> {
    return new Promise((resolve, reject) => {
        const data = [];
        stream.resume();
        stream.setEncoding("utg-8");
        stream.on("data", (chunk) => {
            data.push(chunk);
        });
        stream.on("end", () => {
            return resolve(data.join(""));
        });
        stream.on("error", reject);
    });
}

function readFromFile(filename): Promise<any> {
    return new Promise((resolve, reject) => {
        readFile(filename, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data.toString("utf-8"));
        });
    });
}

function errorHandler(err) {
    error("Compiler error");
    error(err.message || err.toString());
    process.exit(1);
}

function main() {
    readPackageJson().then((result) => {
        info(`Web Audio Markdown Language Compiler (version ${result.version})`);

        program
            .version(result.version)
            .usage("<cmd> [options] <file>")
            .option("-o, --outfile <outfile>", "Output file")
            .parse(process.argv);

        // Accept data from stdin or file input
        if (program.args.length === 0) {
            info("Awaiting data from stdin");
            readFromStream(process.stdin).then(compile).catch(errorHandler);
        } else {
            info(`Compiling file ${program.args[0]}`);
            readFromFile(program.args[0]).then(compile).catch(errorHandler);
        }
    }).catch((err) => {
        error(err.message || "Filesystem error");
    });
}

main();
