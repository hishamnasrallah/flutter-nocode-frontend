// src/app/core/interceptors/auth.interceptor.ts

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';
import { Router } from '@angular/router';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const configService = inject(ConfigService);
  const router = inject(Router);

  // Define endpoints that should NOT have an Authorization header
  // These are typically authentication endpoints themselves
  const AUTH_ENDPOINTS = ['/api/auth/login/', '/api/auth/register/', '/api/auth/refresh/', '/api/auth/logout/'];
  const isAuthEndpoint = AUTH_ENDPOINTS.some(endpoint => req.url.includes(endpoint));

  console.log('AuthInterceptor: Processing request to:', req.url, 'Is auth endpoint:', isAuthEndpoint);

  // Skip interceptor for certain requests (already existing logic)
  if (req.headers.has('Skip-Interceptor')) {
    const newReq = req.clone({
      headers: req.headers.delete('Skip-Interceptor')
    });
    return next(newReq);
  }

  let authReq = req;
  const token = configService.getAccessToken();

  // Only add auth token if available AND it's not an auth endpoint AND the request doesn't already have one
  if (token && !isAuthEndpoint && !req.headers.has('Authorization')) {
    console.log('AuthInterceptor: Adding auth token to request');
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('AuthInterceptor: HTTP Error:', error.status, 'for URL:', req.url);
      // The refresh token logic should only apply to 401s on *protected* endpoints, not auth endpoints
      if (error.status === 401 && !isAuthEndpoint) { // Changed condition here
        console.log('AuthInterceptor: 401 error on protected endpoint, attempting token refresh');
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((response) => {
              console.log('AuthInterceptor: Token refresh successful');
              isRefreshing = false;
              refreshTokenSubject.next(response.access);

              // Retry the original request with new token
              const newAuthReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${response.access}`)
              });
              return next(newAuthReq);
            }),
            catchError((refreshError) => {
              console.log('AuthInterceptor: Token refresh failed, logging out');
              isRefreshing = false;
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        } else {
          // Wait for refresh to complete
          return refreshTokenSubject.pipe(
            filter(token => token != null),
            take(1),
            switchMap(token => {
              const newAuthReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${token}`)
              });
              return next(newAuthReq);
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
};
