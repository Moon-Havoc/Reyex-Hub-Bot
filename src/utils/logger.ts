// ─── ANSI color codes (work in most terminals / PM2 logs) ─────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  // foreground
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  // bright
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightCyan: '\x1b[96m',
};

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO  = 'INFO',
  WARN  = 'WARN',
  ERROR = 'ERROR',
}

// ─── Determine if we should emit color ────────────────────────
const USE_COLOR =
  process.env.NO_COLOR === undefined &&
  process.env.FORCE_COLOR !== '0' &&
  (process.stdout.isTTY ?? false);

function color(code: string, text: string): string {
  return USE_COLOR ? `${code}${text}${C.reset}` : text;
}

// ─── Level config ─────────────────────────────────────────────
const LEVEL_CONFIG: Record<LogLevel, { label: string; colorFn: (t: string) => string }> = {
  [LogLevel.DEBUG]: { label: 'DBG', colorFn: (t) => color(C.gray,          t) },
  [LogLevel.INFO]:  { label: 'INF', colorFn: (t) => color(C.brightCyan,    t) },
  [LogLevel.WARN]:  { label: 'WRN', colorFn: (t) => color(C.brightYellow,  t) },
  [LogLevel.ERROR]: { label: 'ERR', colorFn: (t) => color(C.brightRed,     t) },
};

// ─── Logger ───────────────────────────────────────────────────

export class Logger {
  private static formatTimestamp(): string {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const ss = now.getSeconds().toString().padStart(2, '0');
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    return color(C.dim, `${hh}:${mm}:${ss}.${ms}`);
  }

  private static buildLine(level: LogLevel, message: string): string {
    const { label, colorFn } = LEVEL_CONFIG[level];
    const ts   = this.formatTimestamp();
    const lvl  = colorFn(`[${label}]`);
    const msg  = level === LogLevel.ERROR ? color(C.red, message) : message;
    return `${ts} ${lvl} ${msg}`;
  }

  static debug(message: string, ...meta: unknown[]): void {
    if (process.env.NODE_ENV !== 'development') return;
    console.debug(this.buildLine(LogLevel.DEBUG, message));
    if (meta.length) console.debug(...meta);
  }

  static info(message: string, ...meta: unknown[]): void {
    console.log(this.buildLine(LogLevel.INFO, message));
    if (meta.length) console.log(...meta);
  }

  static warn(message: string, ...meta: unknown[]): void {
    console.warn(this.buildLine(LogLevel.WARN, message));
    if (meta.length) console.warn(...meta);
  }

  static error(message: string, error?: unknown): void {
    console.error(this.buildLine(LogLevel.ERROR, message));
    if (error instanceof Error) {
      console.error(color(C.red, `  → ${error.message}`));
      if (error.stack && process.env.NODE_ENV === 'development') {
        console.error(color(C.dim, error.stack));
      }
    } else if (error !== undefined) {
      console.error(error);
    }
  }

  /** Log a startup banner with key/value pairs */
  static banner(title: string, fields: Record<string, string | number | boolean>): void {
    const line = color(C.gray, '─'.repeat(44));
    console.log(`\n${line}`);
    console.log(color(C.bold + C.magenta, `  ${title}`));
    console.log(line);
    for (const [k, v] of Object.entries(fields)) {
      const key = color(C.cyan, k.padEnd(20));
      const val = color(C.white, String(v));
      console.log(`  ${key} ${val}`);
    }
    console.log(`${line}\n`);
  }

  /** Convenience: log the start of an action and return a done() function */
  static action(message: string): () => void {
    const start = Date.now();
    process.stdout.write(this.buildLine(LogLevel.INFO, `${message}...`));
    return () => {
      const ms = Date.now() - start;
      process.stdout.write(color(C.green, ` ✓ ${ms}ms\n`));
    };
  }
}
