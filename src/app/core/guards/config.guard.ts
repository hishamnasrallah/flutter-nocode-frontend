// src/app/core/guards/config.guard.ts

import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ConfigService } from '../services/config.service';

@Injectable({ providedIn: 'root' })
export class ConfigGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    console.log('ConfigGuard: Checking configuration for route:', state.url);
    
    // Allow access to configuration page without being configured
    if (state.url === '/configuration') {
      console.log('ConfigGuard: Allowing access to configuration page');
      return true;
    }

    // Allow access to auth pages without being configured
    const authPages = ['/login', '/register'];
    if (authPages.includes(state.url)) {
      console.log('ConfigGuard: Allowing access to auth page:', state.url);
      return true;
    }

    if (this.configService.isConfigured()) {
      console.log('ConfigGuard: Configuration is valid');
      return true;
    }

    console.log('ConfigGuard: Not configured, redirecting to configuration page');
    // Redirect to configuration page
    this.router.navigate(['/configuration']);
    return false;
  }
}
