export var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["WARN"] = "WARN";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (LogLevel = {}));
export class Logger {
    static formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}`;
    }
    static info(message) {
        console.log(this.formatMessage(LogLevel.INFO, message));
    }
    static error(message, error) {
        console.error(this.formatMessage(LogLevel.ERROR, message));
        if (error) {
            console.error(error);
        }
    }
    static warn(message) {
        console.warn(this.formatMessage(LogLevel.WARN, message));
    }
    static debug(message) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(this.formatMessage(LogLevel.DEBUG, message));
        }
    }
}
//# sourceMappingURL=logger.js.map