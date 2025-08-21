// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { ConfigGuard } from './core/guards/config.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'configuration',
    loadComponent: () => import('./features/configuration/configuration/configuration.component')
      .then(m => m.ConfigurationComponent),
    title: 'Configuration - Flutter No-Code Builder'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent),
    title: 'Login - Flutter No-Code Builder'
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component')
      .then(m => m.RegisterComponent),
    title: 'Register - Flutter No-Code Builder'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [ConfigGuard, AuthGuard],
    title: 'Dashboard - Flutter No-Code Builder'
  },
  {
    path: 'builder/:appId',
    loadComponent: () => import('./features/builder/builder/builder.component')
      .then(m => m.BuilderComponent),
    canActivate: [ConfigGuard, AuthGuard],
    title: 'App Builder - Flutter No-Code Builder'
  },
  {
    path: 'themes',
    loadComponent: () => import('./features/themes/theme-list/theme-list.component')
      .then(m => m.ThemeListComponent),
    canActivate: [ConfigGuard, AuthGuard],
    title: 'Themes - Flutter No-Code Builder'
  },
  {
    path: 'themes/:id',
    loadComponent: () => import('./features/themes/theme-editor/theme-editor.component')
      .then(m => m.ThemeEditorComponent),
    canActivate: [ConfigGuard, AuthGuard],
    title: 'Theme Editor - Flutter No-Code Builder'
  },
  {
    path: 'data-sources',
    loadComponent: () => import('./features/data-sources/data-source-list/data-source-list.component')
      .then(m => m.DataSourceListComponent),
    canActivate: [ConfigGuard, AuthGuard],
    title: 'Data Sources - Flutter No-Code Builder'
  },
  {
    path: 'actions',
    loadComponent: () => import('./features/actions/action-list/action-list.component')
      .then(m => m.ActionListComponent),
    canActivate: [ConfigGuard, AuthGuard],
    title: 'Actions - Flutter No-Code Builder'
  },
  {
    path: 'build-history/:appId',
    loadComponent: () => import('./features/build/build-history/build-history.component')
      .then(m => m.BuildHistoryComponent),
    canActivate: [ConfigGuard, AuthGuard],
    title: 'Build History - Flutter No-Code Builder'
  },
  {
    path: '**',
    loadComponent: () => import('./features/dashboard/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [ConfigGuard, AuthGuard],
    title: 'Page Not Found - Flutter No-Code Builder'
  }
];
