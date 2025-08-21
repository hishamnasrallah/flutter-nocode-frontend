// src/app/features/configuration/configuration/configuration.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfigService } from '../../../core/services/config.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {
  configForm: FormGroup;
  isConfigured = false;
  isTesting = false;
  testSuccess = false;
  testError = false;
  lastTestedUrl = '';

  defaultUrl = 'http://localhost:8000';

  constructor(
    private fb: FormBuilder,
    private configService: ConfigService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.configForm = this.fb.group({
      backendUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]]
    });
  }

  ngOnInit(): void {
    console.log('Configuration: Component initialized');
    // Check if already configured
    this.isConfigured = this.configService.isConfigured();
    console.log('Configuration: Is configured?', this.isConfigured);

    if (this.isConfigured) {
      const currentUrl = this.configService.getBackendUrl();
      this.configForm.patchValue({ backendUrl: currentUrl });
      this.lastTestedUrl = currentUrl;

      // Don't auto-redirect, let user choose when to continue
      console.log('Configuration: Already configured, showing continue option');
    } else {
      // Set default URL
      this.configForm.patchValue({ backendUrl: this.defaultUrl });
      console.log('Configuration: Not configured, showing setup form');
    }
  }

  async testConnection(): Promise<void> {
    if (this.configForm.invalid) {
      this.notificationService.error('Please enter a valid URL');
      return;
    }

    this.isTesting = true;
    this.testSuccess = false;
    this.testError = false;

    const url = this.configForm.value.backendUrl;

    try {
      const isConnected = await this.configService.testConnection(url).toPromise();

      if (isConnected) {
        this.testSuccess = true;
        this.testError = false;
        this.lastTestedUrl = url;
        this.notificationService.success('Connection successful!');
      } else {
        this.testSuccess = false;
        this.testError = true;
        this.notificationService.error('Failed to connect to backend. Please check the URL and ensure the backend is running.');
      }
    } catch (error) {
      this.testSuccess = false;
      this.testError = true;
      this.notificationService.error('Connection failed. Please check if the backend server is running.');
    } finally {
      this.isTesting = false;
    }
  }

  async saveConfiguration(): Promise<void> {
    if (this.configForm.invalid) {
      this.notificationService.error('Please enter a valid URL');
      return;
    }

    const url = this.configForm.value.backendUrl;

    // Test connection first if not already tested
    if (url !== this.lastTestedUrl) {
      await this.testConnection();

      if (!this.testSuccess) {
        this.notificationService.warning('Connection test failed. Please test the connection before saving.');
        return;
      }
    }

    // Save configuration
    this.configService.setBackendUrl(url);
    this.isConfigured = true;

    this.notificationService.success('Configuration saved successfully!');

    // Redirect to login
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 500);
  }

  skipConfiguration(): void {
    // Use default URL
    this.configService.setBackendUrl(this.defaultUrl);
    this.notificationService.info('Using default configuration');

    // Redirect to login
    this.router.navigate(['/login']);
  }

  changeConfiguration(): void {
    this.isConfigured = false;
    this.testSuccess = false;
    this.testError = false;
    this.lastTestedUrl = '';
  }

  clearConfiguration(): void {
    if (confirm('Are you sure you want to clear the configuration?')) {
      this.configService.clearConfiguration();
      this.configForm.patchValue({ backendUrl: this.defaultUrl });
      this.isConfigured = false;
      this.testSuccess = false;
      this.testError = false;
      this.lastTestedUrl = '';
      this.notificationService.info('Configuration cleared');
    }
  }

  get urlError(): string {
    const control = this.configForm.get('backendUrl');
    if (control?.hasError('required')) {
      return 'Backend URL is required';
    }
    if (control?.hasError('pattern')) {
      return 'Please enter a valid URL (http:// or https://)';
    }
    return '';
  }
}
