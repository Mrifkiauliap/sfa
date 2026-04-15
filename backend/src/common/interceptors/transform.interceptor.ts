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
  meta?: Record<string, unknown>;
  error: null;
}

// ─── Type guard: deteksi apakah controller me-return bentuk { data, message?, meta? }
function isStructuredPayload<T>(
  val: unknown,
): val is { data: T; message?: string; [key: string]: unknown } {
  return (
    val !== null &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    'data' in val
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

    // Objek terstruktur: { data, message?, meta?, ...extras }
    if (isStructuredPayload<T>(payload)) {
      // Destructure known keys, spread sisanya ke root response
      const { data, message, ...extras } = payload as any;
      return {
        ...base,
        message: message ?? 'Success',
        data: data ?? null,
        // Sertakan field tambahan (misal: meta paginasi) langsung di root response
        ...extras,
      };
    }

    // Objek biasa (misal raw entity dari service)
    return { ...base, message: 'Success', data: payload as T };
  }
}
