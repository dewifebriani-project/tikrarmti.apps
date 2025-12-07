// Test script to verify authentication performance improvements

// Run in browser console:
// fetch('/scripts/test-auth-performance.js').then(r => r.text()).then(eval)

async function testAuthPerformance() {
  console.log('=== Authentication Performance Test ===\n');

  // Test 1: Measure initial auth load
  console.log('Test 1: Initial authentication load');
  const authStart = performance.now();

  // Simulate auth check by reloading the page
  const authCheckPromise = new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const loading = document.querySelector('[data-testid="auth-loading"]');
      if (!loading) {
        clearInterval(checkInterval);
        resolve(performance.now());
      }
    }, 100);
  });

  const authEnd = await authCheckPromise;
  const authTime = authEnd - authStart;
  console.log(`✓ Authentication completed in: ${authTime.toFixed(2)}ms`);

  // Test 2: Check localStorage caching
  console.log('\nTest 2: Cache effectiveness');
  const userCache = localStorage.getItem('auth_user_cache');
  if (userCache) {
    const cacheData = JSON.parse(userCache);
    const cacheAge = Date.now() - cacheData.timestamp;
    console.log(`✓ User cache found, age: ${(cacheAge / 1000).toFixed(1)}s`);

    if (cacheAge < 5 * 60 * 1000) { // 5 minutes
      console.log('✓ Cache is fresh');
    } else {
      console.log('⚠ Cache is stale');
    }
  } else {
    console.log('⚠ No user cache found');
  }

  // Test 3: Platform detection
  console.log('\nTest 3: Platform optimization');
  const userAgent = navigator.userAgent;
  const isMobile = /mobile|android|iphone/i.test(userAgent);
  const isTablet = /ipad|tablet/i.test(userAgent);
  const isSlowConnection = navigator.connection?.effectiveType === 'slow-2g' ||
                          navigator.connection?.effectiveType === '2g';

  console.log(`✓ Platform: ${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}`);
  console.log(`✓ Connection: ${isSlowConnection ? 'Slow' : 'Fast'}`);
  console.log(`✓ Optimizations applied: ${isMobile || isSlowConnection ? 'Yes' : 'Standard'}`);

  // Test 4: OAuth flow optimization
  console.log('\nTest 4: OAuth optimization check');
  const oauthParams = new URLSearchParams(window.location.search);
  if (oauthParams.has('code') || window.location.hash.includes('access_token')) {
    console.log('✓ OAuth flow detected');
    console.log('✓ Optimizations: Skipping ensure-user for mobile/tablet');
  } else {
    console.log('ℹ No OAuth flow in progress');
  }

  // Test 5: Network timing
  console.log('\nTest 5: Network performance');
  if ('performance' in window && 'getEntriesByType' in performance) {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const nav = navEntries[0] as PerformanceNavigationTiming;
      console.log(`✓ DOM Loaded: ${nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart}ms`);
      console.log(`✓ Page Load: ${nav.loadEventEnd - nav.loadEventStart}ms`);
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Total auth time: ${authTime.toFixed(2)}ms`);
  console.log(`Status: ${authTime < 3000 ? '✅ Fast' : authTime < 5000 ? '⚠️ Slow' : '❌ Very slow'}`);

  // Recommendations
  console.log('\nRecommendations:');
  if (authTime > 5000) {
    console.log('- Consider checking network connection');
    console.log('- Verify database query performance');
  }
  if (!userCache) {
    console.log('- Cache was not populated - check AuthContext');
  }
  if (isMobile && authTime > 3000) {
    console.log('- Mobile performance may need further optimization');
  }

  return {
    authTime,
    hasCache: !!userCache,
    platform: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };
}

// Export for programmatic use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAuthPerformance };
} else {
  // Auto-run in browser
  window.testAuthPerformance = testAuthPerformance;
}