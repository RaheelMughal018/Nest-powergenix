import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    const logContext = context || this.context || 'Application';
    console.log(`[${new Date().toISOString()}] [LOG] [${logContext}] ${message}`);
  }

  error(message: any, trace?: string, context?: string) {
    const logContext = context || this.context || 'Application';
    console.error(`[${new Date().toISOString()}] [ERROR] [${logContext}] ${message}`);
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: any, context?: string) {
    const logContext = context || this.context || 'Application';
    console.warn(`[${new Date().toISOString()}] [WARN] [${logContext}] ${message}`);
  }

  debug(message: any, context?: string) {
    const logContext = context || this.context || 'Application';
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] [${logContext}] ${message}`);
    }
  }

  verbose(message: any, context?: string) {
    const logContext = context || this.context || 'Application';
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${new Date().toISOString()}] [VERBOSE] [${logContext}] ${message}`);
    }
  }
}
