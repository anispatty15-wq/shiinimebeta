/**
 * Median.co JavaScript Injection
 * 
 * Copy paste code ini ke Median.co Dashboard > Advanced > JavaScript Code
 * Untuk handle OAuth, notifications, dan deep linking
 */

(function() {
  'use strict';

  console.log('🚀 Shiiinime Median Bridge Initialized');

  // ============================================================================
  // 1. OAUTH HANDLING - Fix Google Login in WebView
  // ============================================================================

  // Store original window.open
  const originalWindowOpen = window.open;

  // Override window.open untuk OAuth popups
  window.open = function(url, target, features) {
    console.log('window.open called:', url);

    // OAuth URLs yang perlu dibuka di Custom Tab
    const oauthPatterns = [
      'accounts.google.com',
      'firebase',
      'oauth',
      'auth',
      'login'
    ];

    const isOAuthURL = url && oauthPatterns.some(pattern => 
      url.toLowerCase().includes(pattern)
    );

    if (isOAuthURL) {
      console.log('📱 Opening OAuth URL in Custom Tab:', url);
      
      // Median akan handle ini dengan Custom Tabs/SFSafariViewController
      // Gunakan _blank untuk force Custom Tab
      return originalWindowOpen.call(window, url, '_blank', 'location=yes');
    }

    // Default behavior untuk URL lain
    return originalWindowOpen.call(window, url, target, features);
  };

  // ============================================================================
  // 2. DEEP LINK HANDLING
  // ============================================================================

  // Handle deep link saat app dibuka dari notifikasi
  window.addEventListener('load', function() {
    // Check if opened from deep link
    const href = window.location.href;
    
    if (href.includes('shiiinime://')) {
      console.log('📲 Deep link detected:', href);
      
      // Convert deep link to web path
      const path = href.replace('shiiinime://', '/').replace('shiiinime:', '/');
      
      // Navigate to the path
      if (path && path !== '/') {
        console.log('Navigating to:', path);
        setTimeout(() => {
          window.location.href = path;
        }, 500);
      }
    }
  });

  // ============================================================================
  // 3. PUSH NOTIFICATION HANDLING
  // ============================================================================

  // Wait for Median bridge to be ready
  function waitForMedian(callback, maxRetries = 50) {
    if (typeof median !== 'undefined' && median.notifications) {
      callback();
    } else if (maxRetries > 0) {
      setTimeout(() => waitForMedian(callback, maxRetries - 1), 100);
    } else {
      console.warn('⚠️ Median bridge not available');
    }
  }

  waitForMedian(function() {
    console.log('✅ Median bridge ready');

    // Request notification permission
    if (median.notifications && median.notifications.requestPermission) {
      median.notifications.requestPermission(function(granted) {
        console.log('🔔 Notification permission:', granted ? 'Granted' : 'Denied');
        
        if (granted) {
          // Get FCM token
          if (median.notifications.getToken) {
            median.notifications.getToken(function(token) {
              console.log('📱 FCM Token:', token);
              
              // Save token to localStorage untuk digunakan oleh app
              try {
                localStorage.setItem('median_fcm_token', token);
                
                // Trigger custom event agar React app bisa catch
                const event = new CustomEvent('medianFCMToken', { 
                  detail: { token } 
                });
                window.dispatchEvent(event);
                
                console.log('✅ FCM token saved and event dispatched');
              } catch (e) {
                console.error('Error saving FCM token:', e);
              }
            });
          }
        }
      });
    }

    // Handle notification received (foreground)
    if (median.notifications && median.notifications.onReceive) {
      median.notifications.onReceive = function(notification) {
        console.log('📬 Notification received:', notification);
        
        // Show in-app notification banner (optional)
        // Your React app can listen to this event
        const event = new CustomEvent('notificationReceived', { 
          detail: notification 
        });
        window.dispatchEvent(event);
      };
    }

    // Handle notification clicked
    if (median.notifications && median.notifications.onClick) {
      median.notifications.onClick = function(notification) {
        console.log('👆 Notification clicked:', notification);
        
        // Get click action from notification data
        const data = notification.data || {};
        const clickAction = data.click_action || '/notifications';
        
        console.log('Navigating to:', clickAction);
        
        // Navigate to the URL
        setTimeout(() => {
          if (clickAction.startsWith('http')) {
            window.location.href = clickAction;
          } else if (clickAction.startsWith('/')) {
            window.location.href = clickAction;
          } else {
            window.location.href = '/' + clickAction;
          }
        }, 300);
      };
    }
  });

  // ============================================================================
  // 4. OAUTH CALLBACK HANDLING
  // ============================================================================

  // Detect OAuth redirect back to app
  window.addEventListener('load', function() {
    const url = window.location.href;
    const hash = window.location.hash;
    
    // Check if it's Firebase Auth callback
    if (url.includes('__/auth/handler') || url.includes('firebaseapp.com/__/auth')) {
      console.log('🔐 OAuth callback detected, processing...');
      
      // Show loading indicator
      document.body.style.backgroundColor = '#0F0F12';
      const loader = document.createElement('div');
      loader.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#00E5FF;font-size:16px;text-align:center;';
      loader.innerHTML = '<div style="width:40px;height:40px;border:4px solid #00E5FF;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div><div>Logging in...</div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
      document.body.appendChild(loader);
      
      // Wait for Firebase to process auth
      setTimeout(function() {
        // Redirect back to home or previous page
        const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
        sessionStorage.removeItem('auth_return_url');
        
        console.log('✅ Auth processed, redirecting to:', returnUrl);
        window.location.replace(returnUrl);
      }, 2000);
      
      return;
    }
    
    // Save current URL before OAuth (for return after login)
    if (!url.includes('__/auth/') && !sessionStorage.getItem('auth_return_url')) {
      sessionStorage.setItem('auth_return_url', window.location.pathname);
    }
  });

  // Listen for OAuth callbacks via postMessage
  window.addEventListener('message', function(event) {
    console.log('📨 Message received:', event);
    
    // Check if it's OAuth callback
    if (event.data && (event.data.type === 'oauth-callback' || event.data.type === 'firebaseAuthCallback')) {
      console.log('✅ OAuth callback received via postMessage');
      
      // Reload to complete auth flow
      setTimeout(function() {
        const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
        sessionStorage.removeItem('auth_return_url');
        window.location.replace(returnUrl);
      }, 1000);
    }
  });

  // ============================================================================
  // 5. APP STATE HANDLING
  // ============================================================================

  // Detect app resume from background
  document.addEventListener('resume', function() {
    console.log('📱 App resumed from background');
    
    // Refresh page jika perlu
    // window.location.reload();
  });

  // Detect app pause (going to background)
  document.addEventListener('pause', function() {
    console.log('💤 App going to background');
  });

  // ============================================================================
  // 6. STORAGE SYNC
  // ============================================================================

  // Sync important data with native storage
  function syncToNativeStorage(key, value) {
    if (typeof median !== 'undefined' && median.storage) {
      median.storage.set(key, value);
    }
  }

  // Override localStorage.setItem untuk sync
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    originalSetItem.call(localStorage, key, value);
    
    // Sync important keys to native storage
    const importantKeys = ['user', 'auth', 'fcm', 'token'];
    if (importantKeys.some(k => key.includes(k))) {
      syncToNativeStorage(key, value);
    }
  };

  // ============================================================================
  // 7. ERROR HANDLING
  // ============================================================================

  // Catch and log errors
  window.addEventListener('error', function(event) {
    console.error('❌ Error:', event.error);
  });

  window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled promise rejection:', event.reason);
  });

  // ============================================================================
  // 8. HELPER FUNCTIONS
  // ============================================================================

  // Expose helper functions to window
  window.ShiiinimeMedian = {
    // Get FCM token
    getFCMToken: function() {
      return localStorage.getItem('median_fcm_token');
    },
    
    // Request notification permission
    requestNotificationPermission: function(callback) {
      if (typeof median !== 'undefined' && median.notifications) {
        median.notifications.requestPermission(callback);
      } else {
        callback(false);
      }
    },
    
    // Open URL in Custom Tab
    openInCustomTab: function(url) {
      if (originalWindowOpen) {
        originalWindowOpen.call(window, url, '_blank', 'location=yes');
      } else {
        window.open(url, '_blank');
      }
    },
    
    // Check if running in Median
    isMedianApp: function() {
      return typeof median !== 'undefined';
    },
    
    // Get app info
    getAppInfo: function() {
      if (typeof median !== 'undefined' && median.info) {
        return median.info;
      }
      return null;
    }
  };

  console.log('✅ Shiiinime Median Bridge Ready');
  console.log('📱 Use window.ShiiinimeMedian for helper functions');

})();
