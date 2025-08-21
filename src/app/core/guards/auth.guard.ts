// src/app/core/guards/auth.guard.ts

import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    console.log('AuthGuard: Checking authentication for route:', state.url);
    
    if (this.authService.isAuthenticated()) {
      console.log('AuthGuard: User is authenticated');
      return true;
    }

    console.log('AuthGuard: User not authenticated, checking auth status...');
    // Try to restore session
    return this.authService.checkAuthStatus().pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          console.log('AuthGuard: Session restored successfully');
          return true;
        } else {
          console.log('AuthGuard: No valid session, redirecting to login');
          // Store the attempted URL for redirecting
          localStorage.setItem('redirectUrl', state.url);
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
