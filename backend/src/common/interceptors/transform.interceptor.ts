import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// ─── Shape kontrak response ─────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data: T | null;
  error: null;
}

// ─── Type guard: deteksi apakah controller me-return bentuk { data, message? }
function isStructuredPayload<T>(
  val: unknown,
): val is { data: T; message?: string } {
  return (
    val !== null &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    'data' in (val as object)
  );
}

// ─── Interceptor ─────────────────────────────────────────────────────────────
@Injectable()
export class TransformInterceptor<T = unknown> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const { statusCode } = context.switchToHttp().getResponse<Response>();

    return next
      .handle()
      .pipe(map((payload) => this.buildResponse(payload, statusCode)));
  }

  // ─── Private helper ────────────────────────────────────────────────────
  private buildResponse(payload: unknown, statusCode: number): ApiResponse<T> {
    const base = { statusCode, error: null } as const;

    // Null / undefined
    if (payload == null) {
      return { ...base, message: 'Success', data: null };
    }

    // Primitif atau array → langsung jadi data
    if (typeof payload !== 'object' || Array.isArray(payload)) {
      return { ...base, message: 'Success', data: payload as T };
    }

    // Objek terstruktur: { data, message? }
    if (isStructuredPayload<T>(payload)) {
      return {
        ...base,
        message: payload.message ?? 'Success',
        data: payload.data ?? null,
      };
    }

    // Objek biasa (misal raw entity dari service)
    return { ...base, message: 'Success', data: payload as T };
  }
}
