// Platform detection utilities for optimizing authentication

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isSlowConnection: boolean;
  platform: string;
  userAgent: string;
}

// Cache device info to avoid repeated checks
let deviceInfoCache: DeviceInfo | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getDeviceInfo = (): DeviceInfo => {
  // Check cache first
  if (deviceInfoCache && Date.now() - (deviceInfoCache as any).timestamp < CACHE_DURATION) {
    return deviceInfoCache;
  }

  if (typeof window === 'undefined') {
    // Server-side default
    const defaultInfo: DeviceInfo = {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isIOS: false,
      isAndroid: false,
      isSafari: false,
      isChrome: false,
      isSlowConnection: false,
      platform: 'server',
      userAgent: 'server-side'
    };
    return defaultInfo;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const connection = (navigator as any).connection ||
                    (navigator as any).mozConnection ||
                    (navigator as any).webkitConnection;

  // Mobile detection
  const isMobile = /mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent);

  // Tablet detection (more comprehensive)
  const isTablet = /ipad|android(?!.*mobile)|tablet|kindle|silk|playbook|tablet/i.test(userAgent) ||
                   (isMobile && window.innerWidth >= 768 && window.innerWidth <= 1024);

  // Desktop is anything not mobile or tablet
  const isDesktop = !isMobile && !isTablet;

  // OS detection
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  // Browser detection
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
  const isChrome = /chrome/.test(userAgent) && !/edge|edg/.test(userAgent);

  // Connection speed detection
  const isSlowConnection = connection && (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.downlink < 0.5 // Mbps
  );

  const info: DeviceInfo = {
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isSlowConnection,
    platform: navigator.platform || 'unknown',
    userAgent
  };

  // Cache with timestamp
  (info as any).timestamp = Date.now();
  deviceInfoCache = info;

  return info;
};

// Get optimal timeout based on device
export const getAuthTimeout = (baseTimeout: number = 5000): number => {
  const device = getDeviceInfo();

  if (device.isMobile || device.isSlowConnection) {
    // Increase timeout for mobile or slow connections
    return baseTimeout * 2;
  }

  if (device.isTablet) {
    return baseTimeout * 1.5;
  }

  return baseTimeout;
};

// Get optimal retry count based on device
export const getRetryCount = (): number => {
  const device = getDeviceInfo();

  if (device.isMobile || device.isSlowConnection) {
    return 2; // More retries for mobile
  }

  return 1; // Standard retry for desktop
};

// Check if we should use optimized flow for OAuth
export const shouldUseOptimizedOAuth = (): boolean => {
  const device = getDeviceInfo();

  // Use optimized flow for mobile and tablet
  return device.isMobile || device.isTablet;
};

// Clear device info cache (useful for testing)
export const clearDeviceInfoCache = (): void => {
  deviceInfoCache = null;
};