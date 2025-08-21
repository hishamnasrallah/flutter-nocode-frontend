// src/app/core/interceptors/error.interceptor.ts

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const notificationService = inject(NotificationService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't show notifications for auth endpoints (they handle their own errors)
      const skipNotification = req.url.includes('/auth/') ||
                              req.url.includes('/health/') ||
                              req.headers.has('Skip-Error-Notification');

      if (!skipNotification) {
        switch (error.status) {
          case 400:
            // Bad Request
            if (error.error?.field_errors) {
              notificationService.showValidationErrors(error.error.field_errors);
            } else {
              notificationService.error(
                error.error?.detail || error.error?.message || 'Invalid request'
              );
            }
            break;

          case 401:
            // Unauthorized - don't show notification as auth interceptor handles this
            break;

          case 403:
            // Forbidden
            notificationService.error('You do not have permission to perform this action');
            break;

          case 404:
            // Not Found
            notificationService.error('The requested resource was not found');
            break;

          case 409:
            // Conflict
            notificationService.error(
              error.error?.detail || 'A conflict occurred with the current state'
            );
            break;

          case 422:
            // Unprocessable Entity
            notificationService.error(
              error.error?.detail || 'The request could not be processed'
            );
            break;

          case 429:
            // Too Many Requests
            notificationService.warning('Too many requests. Please try again later');
            break;

          case 500:
            // Internal Server Error
            notificationService.error('A server error occurred. Please try again later');
            break;

          case 502:
          case 503:
          case 504:
            // Bad Gateway / Service Unavailable / Gateway Timeout
            notificationService.error('The service is temporarily unavailable. Please try again later');
            break;

          case 0:
            // Network error
            notificationService.error('Network error. Please check your connection');
            break;

          default:
            if (error.status >= 500) {
              notificationService.error('An unexpected server error occurred');
            } else if (error.status >= 400) {
              notificationService.error(
                error.error?.detail || error.error?.message || 'An error occurred'
              );
            }
        }
      }

      // Log error to console for debugging
      console.error('HTTP Error:', {
        url: req.url,
        status: error.status,
        message: error.message,
        error: error.error
      });

      return throwError(() => error);
    })
  );
};
