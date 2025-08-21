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
    // Allow access to configuration page without being configured
    if (state.url === '/configuration') {
      return true;
    }

    if (this.configService.isConfigured()) {
      return true;
    }

    // Redirect to configuration page
    this.router.navigate(['/configuration']);
    return false;
  }
}
