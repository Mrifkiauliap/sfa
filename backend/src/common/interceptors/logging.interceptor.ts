import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const now = Date.now();

    // Mask sensitive fields
    const maskedBody = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'accessToken',
      'access_token',
      'refreshToken',
      'refresh_token',
      'apiKey',
      'api_key',
    ];
    sensitiveFields.forEach((field) => {
      if (maskedBody[field]) {
        maskedBody[field] = '*********';
      }
    });

    // Log Request for changes/mutations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const userContext = user
        ? `[User: ${user?.username || user?.id || 'Unknown'}]`
        : '[Guest]';

      const contentType = request.headers['content-type'] || '';
      let payloadString = '';

      if (contentType.includes('multipart/form-data')) {
        payloadString = '[Multipart/Form-Data]';
        if (Object.keys(maskedBody).length > 0) {
          payloadString += ` Fields: ${JSON.stringify(maskedBody)}`;
        }
      } else {
        payloadString = JSON.stringify(maskedBody);
      }

      this.logger.log(
        `[REQUEST] ${method} ${url} ${userContext} - Payload: ${payloadString}`,
      );
    }

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const delay = Date.now() - now;
        this.logger.log(
          `[RESPONSE] ${method} ${url} ${response.statusCode} - ${delay}ms`,
        );
      }),
      catchError((err) => {
        const delay = Date.now() - now;
        this.logger.error(
          `[ERROR] ${method} ${url} ${err.status || 500} - ${delay}ms - ${err.message}`,
          err.stack,
        );
        return throwError(() => err);
      }),
    );
  }
}
