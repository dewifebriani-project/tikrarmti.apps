/**
 * Enhanced fetch wrapper with automatic CSRF token inclusion
 */

export interface FetchOptions extends RequestInit {
  includeCSRF?: boolean;
}

export async function secureFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { includeCSRF = false, ...fetchOptions } = options;

  // Automatically include CSRF token for state-changing methods
  if (includeCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(fetchOptions.method?.toUpperCase() || '')) {
    // Get CSRF token from cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf-token') {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'x-csrf-token': value,
        };
        break;
      }
    }
  }

  // Ensure credentials are included for cookies
  fetchOptions.credentials = fetchOptions.credentials || 'include';

  return fetch(url, fetchOptions);
}

// Helper methods for common HTTP operations
export const securePost = (url: string, data: any, options: FetchOptions = {}) => {
  return secureFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
    includeCSRF: true,
    ...options,
  });
};

export const securePut = (url: string, data: any, options: FetchOptions = {}) => {
  return secureFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
    includeCSRF: true,
    ...options,
  });
};

export const secureDelete = (url: string, options: FetchOptions = {}) => {
  return secureFetch(url, {
    method: 'DELETE',
    includeCSRF: true,
    ...options,
  });
};