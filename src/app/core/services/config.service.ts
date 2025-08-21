// src/app/core/services/config.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private CONFIG_KEY = 'backend_config';
  private TOKEN_KEY = 'access_token';
  private REFRESH_TOKEN_KEY = 'refresh_token';

  constructor(private http: HttpClient) {}

  // Check if backend is configured
  isConfigured(): boolean {
    const config = localStorage.getItem(this.CONFIG_KEY);
    const isConfigured = config !== null && config !== '';
    console.log('ConfigService: Backend configured?', isConfigured, 'URL:', config);
    return isConfigured;
  }

  // Get current backend URL
  getBackendUrl(): string {
    const config = localStorage.getItem(this.CONFIG_KEY);
    return config || 'http://localhost:8000';
  }

  // Set backend URL
  setBackendUrl(url: string): void {
    // Remove trailing slash
    url = url.replace(/\/$/, '');
    localStorage.setItem(this.CONFIG_KEY, url);
  }

  // Clear backend configuration
  clearConfiguration(): void {
    localStorage.removeItem(this.CONFIG_KEY);
  }

  // Test backend connection
  testConnection(url: string): Observable<boolean> {
    // Remove trailing slash
    url = url.replace(/\/$/, '');

    return this.http.get(`${url}/health/`, {
      responseType: 'text',
      headers: { 'Skip-Interceptor': 'true' }
    }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  // Get full API URL
  getApiUrl(endpoint: string): string {
    const baseUrl = this.getBackendUrl();
    // Ensure endpoint starts with /
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }
    return `${baseUrl}${endpoint}`;
  }

  // Get WebSocket URL
  getWsUrl(): string {
    const baseUrl = this.getBackendUrl();
    return baseUrl.replace(/^http/, 'ws');
  }

  // Token management
  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // User preference storage
  setPreference(key: string, value: any): void {
    localStorage.setItem(`pref_${key}`, JSON.stringify(value));
  }

  getPreference<T>(key: string, defaultValue: T): T {
    const stored = localStorage.getItem(`pref_${key}`);
    if (stored) {
      try {
        return JSON.parse(stored) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }

  // Environment detection
  isDevelopment(): boolean {
    return !this.isProduction();
  }

  isProduction(): boolean {
    return window.location.hostname !== 'localhost' &&
           window.location.hostname !== '127.0.0.1';
  }

  // Mock mode for development
  isMockMode(): boolean {
    return this.getPreference('mockMode', false) && this.isDevelopment();
  }

  setMockMode(enabled: boolean): void {
    this.setPreference('mockMode', enabled);
  }
}
