// Debug script to help investigate routing issues
// Run this in browser console to check current state

function debugRouting() {
  console.group('🔍 Routing Debug Information');
  
  // Check current URL
  console.log('Current URL:', window.location.href);
  console.log('Current pathname:', window.location.pathname);
  console.log('Current hash:', window.location.hash);
  
  // Check localStorage for configuration and auth
  console.group('📦 LocalStorage State');
  console.log('Backend Config:', localStorage.getItem('backend_config'));
  console.log('Access Token:', localStorage.getItem('access_token') ? 'Present' : 'Not found');
  console.log('Refresh Token:', localStorage.getItem('refresh_token') ? 'Present' : 'Not found');
  console.log('Current User:', localStorage.getItem('current_user'));
  console.log('Redirect URL:', localStorage.getItem('redirectUrl'));
  console.groupEnd();
  
  // Check if services are available
  console.group('🔧 Service Status');
  try {
    const configService = (window as any).ng?.getComponent?.(document.querySelector('app-root'))?.configService;
    if (configService) {
      console.log('Config Service - Is Configured:', configService.isConfigured());
      console.log('Config Service - Backend URL:', configService.getBackendUrl());
    } else {
      console.log('Config Service: Not accessible');
    }
    
    const authService = (window as any).ng?.getComponent?.(document.querySelector('app-root'))?.authService;
    if (authService) {
      console.log('Auth Service - Is Authenticated:', authService.isAuthenticated());
      console.log('Auth Service - Current User:', authService.currentUserValue);
    } else {
      console.log('Auth Service: Not accessible');
    }
  } catch (error) {
    console.log('Services not accessible via window.ng');
  }
  console.groupEnd();
  
  // Check Angular Router state
  console.group('🛣️ Router State');
  try {
    const router = (window as any).ng?.getComponent?.(document.querySelector('app-root'))?.router;
    if (router) {
      console.log('Current Router URL:', router.url);
      console.log('Router State:', router.routerState);
    } else {
      console.log('Router: Not accessible');
    }
  } catch (error) {
    console.log('Router not accessible');
  }
  console.groupEnd();
  
  console.groupEnd();
}

// Auto-run debug
debugRouting();

// Make function available globally
(window as any).debugRouting = debugRouting;

console.log('🚀 Debug script loaded. Run debugRouting() anytime to check routing state.');