export declare enum LogLevel {
    INFO = "INFO",
    ERROR = "ERROR",
    WARN = "WARN",
    DEBUG = "DEBUG"
}
export declare class Logger {
    private static formatMessage;
    static info(message: string): void;
    static error(message: string, error?: unknown): void;
    static warn(message: string): void;
    static debug(message: string): void;
}
//# sourceMappingURL=logger.d.ts.map