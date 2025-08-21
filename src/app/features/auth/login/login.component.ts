// src/app/features/auth/login/login.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  rememberMe = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Check if already authenticated
    if (this.authService.isAuthenticated()) {
      console.log('Login: User already authenticated, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
      return;
    }

    // Check for stored credentials (if remember me was checked)
    const storedUsername = localStorage.getItem('remembered_username');
    if (storedUsername) {
      this.loginForm.patchValue({ username: storedUsername });
      this.rememberMe = true;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;

    try {
      const credentials = this.loginForm.value;
      const response = await this.authService.login(credentials).toPromise();

      if (response) {
        // Handle remember me
        if (this.rememberMe) {
          localStorage.setItem('remembered_username', credentials.username);
        } else {
          localStorage.removeItem('remembered_username');
        }

        this.notificationService.success(`Welcome back, ${response.user.first_name || response.user.username}!`);

        // Check for redirect URL
        const redirectUrl = localStorage.getItem('redirectUrl');
        if (redirectUrl) {
          localStorage.removeItem('redirectUrl');
          this.router.navigateByUrl(redirectUrl);
        } else {
          this.router.navigate(['/dashboard']);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.status === 401) {
        this.notificationService.error('Invalid username or password');
      } else if (error.status === 0) {
        this.notificationService.error('Cannot connect to server. Please check your configuration.');
      } else {
        this.notificationService.error(error.message || 'Login failed. Please try again.');
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Demo login for testing
  fillDemoCredentials(): void {
    this.loginForm.patchValue({
      username: 'demo',
      password: 'demo123'
    });
    this.notificationService.info('Demo credentials filled. Click Login to continue.');
  }

  // Field validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${minLength} characters`;
    }
    return '';
  }
}
