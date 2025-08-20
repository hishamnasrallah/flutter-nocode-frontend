// src/app/features/dashboard/create-project-dialog/create-project-dialog.component.ts

import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApplicationService } from '../../../core/services/application.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Application } from '../../../core/models/application.model';
import { ThemeService } from '../../../core/services/theme.service';
import { Theme } from '../../../core/models/theme.model';

@Component({
  selector: 'app-create-project-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-project-dialog.component.html',
  styleUrls: ['./create-project-dialog.component.scss']
})
export class CreateProjectDialogComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<Application>();

  projectForm: FormGroup;
  isCreating = false;
  availableThemes: Theme[] = [];
  templates = [
    { id: 'blank', name: 'Blank', icon: 'add_box', selected: true },
    { id: 'ecommerce', name: 'E-Commerce', icon: 'shopping_cart', selected: false },
    { id: 'social', name: 'Social Media', icon: 'people', selected: false },
    { id: 'blog', name: 'Blog', icon: 'article', selected: false }
  ];

  constructor(
    private fb: FormBuilder,
    private applicationService: ApplicationService,
    private notificationService: NotificationService,
    private themeService: ThemeService
  ) {
    this.projectForm = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
  description: ['', [Validators.maxLength(200)]],
  package_name: ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/)]],
  template: ['blank'],
  theme: [null, Validators.required] // Added theme field and made it required
});

  }

  ngOnInit(): void {
  // Auto-generate package name based on project name
  this.projectForm.get('name')?.valueChanges.subscribe(name => {
    if (name && !this.projectForm.get('package_name')?.dirty) {
      const packageName = this.generatePackageName(name);
      this.projectForm.patchValue({ package_name: packageName }, { emitEvent: false });
    }
  });

  // Fetch themes and set a default
  this.themeService.getThemes().subscribe({
    next: (response) => {
      this.availableThemes = response.results;
      if (this.availableThemes.length > 0) {
        // Find a default theme, e.g., the first one, or one named "Material Blue"
        const defaultTheme = this.availableThemes.find(t => t.name === 'Material Blue') || this.availableThemes[0];
        // Ensure the defaultTheme and its id are valid before setting
        if (defaultTheme && defaultTheme.id != null) {
          this.projectForm.patchValue({ theme: defaultTheme.id }); // Set the theme ID in the form
        } else {
          this.projectForm.patchValue({ theme: null }); // Explicitly set to null if no valid theme
        }
      } else {
        this.projectForm.patchValue({ theme: null }); // Explicitly set to null if no themes available
        this.notificationService.warning('No themes available. Please create one first.');
      }
    },
    error: (err) => {
      console.error('Failed to load themes:', err);
      this.projectForm.patchValue({ theme: null }); // Explicitly set to null on error
      this.notificationService.error('Failed to load themes for project creation.');
    }
  });
}


  selectTemplate(templateId: string): void {
    this.templates.forEach(t => t.selected = t.id === templateId);
    this.projectForm.patchValue({ template: templateId });
  }

  generatePackageName(name: string): string {
    const cleaned = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    return `com.example.${cleaned || 'app'}`;
  }

  onClose(): void {
    this.close.emit();
  }

  async onCreate(): Promise<void> {
    if (this.projectForm.invalid) {
      Object.keys(this.projectForm.controls).forEach(key => {
        this.projectForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isCreating = true;

    try {
      const formValue = this.projectForm.value;
      const createData = {
        name: formValue.name,
        description: formValue.description || '',
        package_name: formValue.package_name,
        version: '1.0.0',
        theme: formValue.theme // Include the selected theme ID
      };


      const application = await this.applicationService.createApplication(createData).toPromise();

      if (application) {
        this.notificationService.success(`Project "${application.name}" created successfully!`);
        this.created.emit(application);
      }
    } catch (error: any) {
      console.error('Failed to create project:', error);

      if (error.error?.field_errors) {
        const fieldErrors = error.error.field_errors;

        if (fieldErrors.name) {
          this.projectForm.get('name')?.setErrors({
            serverError: fieldErrors.name[0]
          });
        }

        if (fieldErrors.package_name) {
          this.projectForm.get('package_name')?.setErrors({
            serverError: fieldErrors.package_name[0]
          });
        }

        this.notificationService.error('Please correct the errors in the form');
      } else {
        this.notificationService.error(error.message || 'Failed to create project');
      }
    } finally {
      this.isCreating = false;
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.projectForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.projectForm.get(fieldName);

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
      if (fieldName === 'package_name') {
        return 'Package name must be in format: com.example.appname';
      }
    }

    if (field?.hasError('serverError')) {
      return field.errors?.['serverError'];
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'name': 'Project Name',
      'description': 'Description',
      'package_name': 'Package Name'
    };

    return labels[fieldName] || fieldName;
  }
}
