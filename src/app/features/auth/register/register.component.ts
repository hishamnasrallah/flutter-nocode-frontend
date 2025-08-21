// src/app/features/auth/register/register.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;
  acceptTerms = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      first_name: [''],
      last_name: [''],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        this.passwordValidator
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Check if already authenticated
    if (this.authService.isAuthenticated()) {
      console.log('Register: User already authenticated, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
      return;
    }

    // Watch password changes for strength indicator
    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.passwordStrength = this.calculatePasswordStrength(password);
    });
  }

  // Custom validator for password strength
  passwordValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.value;
    if (!password) return null;

    const hasNumber = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);

    const valid = hasNumber && hasUpper && hasLower;

    if (!valid) {
      return { weakPassword: true };
    }

    return null;
  }

  // Validator to check if passwords match
  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      const errors = group.get('confirmPassword')?.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        if (Object.keys(errors).length === 0) {
          group.get('confirmPassword')?.setErrors(null);
        }
      }
    }

    return null;
  }

  calculatePasswordStrength(password: string): number {
    if (!password) return 0;

    let strength = 0;

    // Length
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 20;

    // Character types
    if (/[a-z]/.test(password)) strength += 10;
    if (/[A-Z]/.test(password)) strength += 10;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

    return Math.min(100, strength);
  }

  getPasswordStrengthClass(): string {
    if (this.passwordStrength < 30) return 'weak';
    if (this.passwordStrength < 60) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength < 30) return 'Weak';
    if (this.passwordStrength < 60) return 'Medium';
    return 'Strong';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid || !this.acceptTerms) {
      // Mark all fields as touched
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });

      if (!this.acceptTerms) {
        this.notificationService.error('Please accept the terms and conditions');
      }

      return;
    }

    this.isLoading = true;

    try {
      const formValue = this.registerForm.value;
      const registerData = {
        username: formValue.username,
        email: formValue.email,
        password: formValue.password,
        first_name: formValue.first_name,
        last_name: formValue.last_name
      };

      const response = await this.authService.register(registerData).toPromise();

      if (response) {
        this.notificationService.success('Registration successful! Welcome aboard!');
        this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.error?.field_errors) {
        // Handle field-specific errors
        const fieldErrors = error.error.field_errors;

        if (fieldErrors.username) {
          this.registerForm.get('username')?.setErrors({
            serverError: fieldErrors.username[0]
          });
        }

        if (fieldErrors.email) {
          this.registerForm.get('email')?.setErrors({
            serverError: fieldErrors.email[0]
          });
        }

        this.notificationService.error('Please correct the errors in the form');
      } else if (error.status === 0) {
        this.notificationService.error('Cannot connect to server. Please check your configuration.');
      } else {
        this.notificationService.error(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Field validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);

    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }

    if (field?.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be no more than ${maxLength} characters`;
    }

    if (field?.hasError('pattern')) {
      if (fieldName === 'username') {
        return 'Username can only contain letters, numbers, and underscores';
      }
    }

    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }

    if (field?.hasError('weakPassword')) {
      return 'Password must contain uppercase, lowercase, and numbers';
    }

    if (field?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }

    if (field?.hasError('serverError')) {
      return field.errors?.['serverError'];
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'username': 'Username',
      'email': 'Email',
      'first_name': 'First Name',
      'last_name': 'Last Name',
      'password': 'Password',
      'confirmPassword': 'Confirm Password'
    };

    return labels[fieldName] || fieldName;
  }
}
