import winston, { Logger } from "winston";
import "winston-daily-rotate-file";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, align, errors } = winston.format;

const fileRotateTransport: DailyRotateFile = new winston.transports.DailyRotateFile({
    dirname: "./logs",
    filename: "ALClient-%DATE%.log",
    datePattern: "DD-MM-YYYY",
    maxFiles: "7d"
});

const logger: Logger = winston.createLogger({
    level: process.env.AL_LOG_LEVEL || "info",
    format: combine(
        errors({ stack: true }),
        timestamp({
            format: "DD-MM-YYYY HH:mm:ss.SSS"
        }),
        align(),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
    transports: [fileRotateTransport]
});

function toLogMessage(args: any[]): string {
    return args
        .map((arg) => {
            if (arg instanceof Error) {
                return arg.stack || `${arg.name}: ${arg.message}`;
            }

            if (arg === "object") {
                try {
                    return JSON.stringify(arg);
                } catch {
                    return String(arg);
                }
            }

            return String(arg);
        })
        .join(" ");
}

export function wrapLog(): void {
    console.log = (...args) => logger.info(toLogMessage(args));
    console.info = (...args) => logger.info(toLogMessage(args));
    console.warn = (...args) => logger.warn(toLogMessage(args));
    console.error = (...args) => logger.error(toLogMessage(args));
    console.debug = (...args) => logger.debug(toLogMessage(args));
}

const originalConsole = {
    log: console.log,
    info: console.info,
    error: console.error,
    warn: console.warn,
    debug: console.debug
};
export function unwrapLog(): void {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
}

export default logger;
