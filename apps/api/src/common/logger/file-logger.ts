import { mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

export class FileLogger {
  private readonly logFile: string;

  constructor(logDir = join(process.cwd(), 'logs')) {
    mkdirSync(logDir, { recursive: true });
    this.logFile = join(logDir, 'app.log');
  }

  private write(level: string, message: any, ...optionalParams: any[]): void {
    const timestamp = new Date().toISOString();
    const params = optionalParams.length
      ? ` ${optionalParams.map((param) => this.format(param)).join(' ')}`
      : '';
    const line = `[${timestamp}] [${level}] ${this.format(message)}${params}\n`;

    // eslint-disable-next-line no-console
    console.log(line.trimEnd());
    appendFileSync(this.logFile, line);
  }

  private format(value: any): string {
    if (value instanceof Error) {
      return `${value.message}\n${value.stack ?? ''}`;
    }

    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return String(value);
  }

  log(message: any, ...optionalParams: any[]): any {
    this.write('LOG', message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]): any {
    this.write('ERROR', message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]): any {
    this.write('WARN', message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]): any {
    this.write('DEBUG', message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]): any {
    this.write('VERBOSE', message, ...optionalParams);
  }

  fatal(message: any, ...optionalParams: any[]): any {
    this.write('FATAL', message, ...optionalParams);
  }

  setLogLevels(_levels: any[]): any {
    return undefined;
  }
}
