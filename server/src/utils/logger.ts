import winston from "winston";
import chalk from "chalk";

const { combine, timestamp, printf, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
    const time = chalk.gray(timestamp);
    const text = stack || message;

    switch (level) {
        case "error":
            return `${time} ${chalk.bgRed.white.bold(" ERROR ")} ${chalk.red(text)}`;

        case "warn":
            return `${time} ${chalk.bgYellow.black.bold(" WARN  ")} ${chalk.yellow(text)}`;

        case "info":
            return `${time} ${chalk.bgGreen.black.bold(" INFO  ")} ${chalk.green(text)}`;

        case "http":
            return `${time} ${chalk.bgCyan.black.bold(" HTTP  ")} ${chalk.cyan(text)}`;

        case "debug":
            return `${time} ${chalk.bgMagenta.white.bold(" DEBUG ")} ${chalk.magenta(text)}`;

        default:
            return `${time} ${level} ${text}`;
    }
});

const logger = winston.createLogger({
    level: "http",
    format: combine(
        timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        errors({ stack: true })
    ),
    transports: [
        new winston.transports.Console({
            format: logFormat,
        }),

        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
        }),

        new winston.transports.File({
            filename: "logs/combined.log",
        }),
    ],
});

export default logger;