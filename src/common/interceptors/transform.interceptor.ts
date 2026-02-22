import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
}

interface ResponseWithStatusCode {
  statusCode: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse<ResponseWithStatusCode>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data: T & { message?: string; data?: T; meta?: unknown }) => ({
        statusCode,
        message: data?.message || 'Success',
        // Keep full payload for paginated responses (data + meta); otherwise unwrap data if present
        data:
          data?.meta !== undefined
            ? data
            : data?.data !== undefined
              ? data.data
              : data,
      })),
    );
  }
}
