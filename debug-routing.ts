// Enhanced debug script to help investigate routing issues
// Run this in browser console to check current state

function debugRouting() {
  console.group('🔍 Enhanced Routing Debug Information');
  
  // Check current URL
  console.log('Current URL:', window.location.href);
  console.log('Current pathname:', window.location.pathname);
  console.log('Current hash:', window.location.hash);
  console.log('Current search:', window.location.search);
  
  // Check localStorage for configuration and auth
  console.group('📦 LocalStorage State');
  console.log('Backend Config:', localStorage.getItem('backend_config'));
  console.log('Access Token:', localStorage.getItem('access_token') ? 'Present' : 'Not found');
  console.log('Refresh Token:', localStorage.getItem('refresh_token') ? 'Present' : 'Not found');
  console.log('Current User:', localStorage.getItem('current_user'));
  console.log('Redirect URL:', localStorage.getItem('redirectUrl'));
  console.log('Remembered Username:', localStorage.getItem('remembered_username'));
  console.groupEnd();
  
  // Check Angular Router state
  console.group('🛣️ Router State');
  try {
    const appRoot = document.querySelector('app-root');
    if (appRoot) {
      const component = (window as any).ng?.getComponent?.(appRoot);
      if (component) {
        console.log('App Component found');
        
        // Try to access router through Angular's debugging API
        const router = (window as any).ng?.getInjector?.(appRoot)?.get?.('Router');
        if (router) {
          console.log('Current Router URL:', router.url);
          console.log('Router Navigation ID:', router.getCurrentNavigation()?.id);
          console.log('Router State Tree:', router.routerState.root);
        } else {
          console.log('Router: Not accessible via ng API');
        }
      }
    }
  } catch (error) {
    console.log('Router access error:', error);
  }
  console.groupEnd();
  
  // Check guard states
  console.group('🛡️ Guard Debug');
  
  // Simulate guard checks
  const backendUrl = localStorage.getItem('backend_config');
  const accessToken = localStorage.getItem('access_token');
  const currentUser = localStorage.getItem('current_user');
  
  console.log('ConfigGuard would pass:', !!backendUrl);
  console.log('AuthGuard would pass:', !!(accessToken && currentUser));
  
  // Check if on protected route
  const currentPath = window.location.pathname;
  const protectedRoutes = ['/dashboard', '/builder', '/themes', '/data-sources', '/actions'];
  const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));
  console.log('Is protected route:', isProtectedRoute);
  
  console.groupEnd();
  
  // Check for redirect loops
  console.group('🔄 Redirect Loop Detection');
  const navigationHistory = JSON.parse(sessionStorage.getItem('navigation_history') || '[]');
  console.log('Recent navigation history:', navigationHistory);
  
  // Check for rapid redirects
  const recentRedirects = navigationHistory.filter((entry: any) => 
    Date.now() - entry.timestamp < 5000
  );
  
  if (recentRedirects.length > 3) {
    console.warn('⚠️ Potential redirect loop detected!');
    console.log('Recent redirects:', recentRedirects);
  }
  console.groupEnd();
  
  // Network requests check
  console.group('🌐 Network State');
  console.log('Online status:', navigator.onLine);
  
  // Check if backend is reachable
  if (backendUrl) {
    fetch(`${backendUrl}/health/`, { method: 'GET' })
      .then(response => {
        console.log('Backend health check:', response.status === 200 ? 'OK' : 'Failed');
      })
      .catch(error => {
        console.log('Backend health check failed:', error.message);
      });
  }
  console.groupEnd();
  
  console.groupEnd();
  
  // Recommendations
  console.group('💡 Recommendations');
  if (!backendUrl) {
    console.log('1. Configure backend URL at /configuration');
  }
  if (!accessToken) {
    console.log('2. Login at /login');
  }
  if (recentRedirects.length > 3) {
    console.log('3. Clear localStorage and refresh page to break redirect loop');
    console.log('   Run: localStorage.clear(); location.reload();');
  }
  console.groupEnd();
}

// Track navigation for redirect loop detection
function trackNavigation() {
  const history = JSON.parse(sessionStorage.getItem('navigation_history') || '[]');
  history.push({
    url: window.location.pathname,
    timestamp: Date.now()
  });
  
  // Keep only last 10 entries
  if (history.length > 10) {
    history.shift();
  }
  
  sessionStorage.setItem('navigation_history', JSON.stringify(history));
}

// Auto-track navigation
trackNavigation();

// Auto-run debug
debugRouting();

// Make functions available globally
(window as any).debugRouting = debugRouting;
(window as any).clearAuthData = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('current_user');
  localStorage.removeItem('redirectUrl');
  console.log('Auth data cleared. Refresh the page.');
};

console.log('🚀 Enhanced debug script loaded.');
console.log('Available commands:');
console.log('- debugRouting() - Full routing debug');
console.log('- clearAuthData() - Clear authentication data');