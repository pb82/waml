import {Logger, transports} from "winston";
import {LoggerConfig} from "./config";

const logger = new Logger({
    colors: {
        colors: {
            debug: "blue",
            error: "red",
            info: "green",
            warn: "yellow",
        },
    },
});

if (LoggerConfig.console.enabled) {
    logger.add(transports.Console, {
        colorize: LoggerConfig.console.colorize,
        level: LoggerConfig.console.level,
    });
}

export const info = logger.info;
export const warn = logger.warn;
export const error = logger.error;
export const debug = logger.debug;
