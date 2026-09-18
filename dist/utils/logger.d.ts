export declare enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}
export declare class Logger {
    private static formatTimestamp;
    private static buildLine;
    static debug(message: string, ...meta: unknown[]): void;
    static info(message: string, ...meta: unknown[]): void;
    static warn(message: string, ...meta: unknown[]): void;
    static error(message: string, error?: unknown): void;
    /** Log a startup banner with key/value pairs */
    static banner(title: string, fields: Record<string, string | number | boolean>): void;
    /** Convenience: log the start of an action and return a done() function */
    static action(message: string): () => void;
}
//# sourceMappingURL=logger.d.ts.map