/** @odoo-module **/

/**
 * Service Worker Cleanup for Odoo 17
 * This script helps resolve cache-related errors with the service worker
 */

// Function to clean up service worker and cache
const cleanupServiceWorker = async () => {
  try {
    // Check if service worker is registered
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // Unregister all service workers
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Service Worker unregistered:', registration.scope);
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('All caches cleared');
      }
      
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      console.log('Local and session storage cleared');
      
      // Reload the page to apply changes
      window.location.reload();
    }
  } catch (error) {
    console.warn('Service Worker cleanup failed:', error);
  }
};

// Auto-cleanup on module load
cleanupServiceWorker();

// Export for manual use
export { cleanupServiceWorker };
