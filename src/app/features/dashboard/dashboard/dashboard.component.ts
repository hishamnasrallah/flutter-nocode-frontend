// src/app/features/dashboard/dashboard/dashboard.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ApplicationService } from '../../../core/services/application.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProjectCardComponent } from '../project-card/project-card.component';
import { CreateProjectDialogComponent } from '../create-project-dialog/create-project-dialog.component';
import { Application } from '../../../core/models/application.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectCardComponent, CreateProjectDialogComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  applications: Application[] = [];
  filteredApplications: Application[] = [];
  recentApplications: Application[] = [];
  isLoading = true;
  searchQuery = '';
  sortBy: 'name' | 'updated' | 'created' = 'updated';
  viewMode: 'grid' | 'list' = 'grid';
  showCreateDialog = false;

  stats = {
    totalApps: 0,
    activeBuilds: 0,
    successfulBuilds: 0,
    failedBuilds: 0
  };

  templates = [
    {
      id: 'blank',
      name: 'Blank App',
      description: 'Start from scratch',
      icon: 'add_box',
      color: '#667eea'
    },
    {
      id: 'ecommerce',
      name: 'E-Commerce',
      description: 'Online shopping app',
      icon: 'shopping_cart',
      color: '#4caf50'
    },
    {
      id: 'social',
      name: 'Social Media',
      description: 'Social networking app',
      icon: 'people',
      color: '#2196f3'
    },
    {
      id: 'news',
      name: 'News & Blog',
      description: 'Content publishing app',
      icon: 'article',
      color: '#ff9800'
    },
    {
      id: 'recipe',
      name: 'Recipe App',
      description: 'Food & cooking app',
      icon: 'restaurant',
      color: '#e91e63'
    },
    {
      id: 'weather',
      name: 'Weather App',
      description: 'Weather forecast app',
      icon: 'wb_sunny',
      color: '#00bcd4'
    }
  ];

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Dashboard: Component initialized');
    
    // Check if we should be here
    if (!this.authService.isAuthenticated()) {
      console.log('Dashboard: User not authenticated, should not be here');
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadUser();
    this.loadApplications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUser(): void {
    console.log('Dashboard: Loading user data');
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        console.log('Dashboard: User loaded:', user?.username);
        this.currentUser = user;
      });
  }

  private loadApplications(): void {
    console.log('Dashboard: Loading applications');
    this.isLoading = true;

    this.applicationService.getApplications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Dashboard: Applications loaded:', response.results.length);
          this.applications = response.results;
          this.filteredApplications = [...this.applications];
          this.updateStats();
          this.sortApplications();

          // Get recent 5 apps
          this.recentApplications = [...this.applications]
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, 5);

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Dashboard: Failed to load applications:', error);
          this.notificationService.error('Failed to load applications');
          this.isLoading = false;
        }
      });
  }

  private updateStats(): void {
    this.stats.totalApps = this.applications.length;
    this.stats.activeBuilds = this.applications.filter(app => app.build_status === 'building').length;
    this.stats.successfulBuilds = this.applications.filter(app => app.build_status === 'success').length;
    this.stats.failedBuilds = this.applications.filter(app => app.build_status === 'failed').length;
  }

  onSearchChange(): void {
    if (!this.searchQuery.trim()) {
      this.filteredApplications = [...this.applications];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredApplications = this.applications.filter(app =>
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.package_name.toLowerCase().includes(query)
      );
    }
    this.sortApplications();
  }

  onSortChange(): void {
    this.sortApplications();
  }

  private sortApplications(): void {
    this.filteredApplications.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  openCreateDialog(): void {
    this.showCreateDialog = true;
  }

  closeCreateDialog(): void {
    this.showCreateDialog = false;
  }

  onProjectCreated(application: Application): void {
    this.applications.unshift(application);
    this.filteredApplications = [...this.applications];
    this.updateStats();
    this.sortApplications();
    this.closeCreateDialog();

    // Navigate to builder
    this.router.navigate(['/builder', application.id]);
  }

  onProjectOpen(application: Application): void {
    this.router.navigate(['/builder', application.id]);
  }

  onProjectClone(application: Application): void {
    this.applicationService.cloneApplication(application.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clonedApp) => {
          this.applications.unshift(clonedApp);
          this.filteredApplications = [...this.applications];
          this.updateStats();
          this.sortApplications();
          this.notificationService.success(`Successfully cloned "${application.name}"`);
        },
        error: (error) => {
          console.error('Failed to clone application:', error);
          this.notificationService.error('Failed to clone application');
        }
      });
  }

  onProjectDelete(application: Application): void {
    if (confirm(`Are you sure you want to delete "${application.name}"? This action cannot be undone.`)) {
      this.applicationService.deleteApplication(application.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.applications = this.applications.filter(app => app.id !== application.id);
            this.filteredApplications = this.filteredApplications.filter(app => app.id !== application.id);
            this.updateStats();
            this.notificationService.success(`Successfully deleted "${application.name}"`);
          },
          error: (error) => {
            console.error('Failed to delete application:', error);
            this.notificationService.error('Failed to delete application');
          }
        });
    }
  }

  createFromTemplate(templateId: string): void {
    if (templateId === 'blank') {
      this.openCreateDialog();
    } else {
      // Create from template
      this.applicationService.createFromTemplate(templateId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (application) => {
            this.applications.unshift(application);
            this.filteredApplications = [...this.applications];
            this.updateStats();
            this.sortApplications();
            this.notificationService.success(`Successfully created app from template`);
            this.router.navigate(['/builder', application.id]);
          },
          error: (error) => {
            console.error('Failed to create from template:', error);
            this.notificationService.error('Failed to create application from template');
          }
        });
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getUserDisplayName(): string {
    if (this.currentUser) {
      return this.currentUser.first_name || this.currentUser.username;
    }
    return 'User';
  }

  getUserInitials(): string {
    if (this.currentUser) {
      if (this.currentUser.first_name && this.currentUser.last_name) {
        return `${this.currentUser.first_name[0]}${this.currentUser.last_name[0]}`.toUpperCase();
      }
      return this.currentUser.username.substring(0, 2).toUpperCase();
    }
    return 'U';
  }
}
