import type { ApiResponse, LookupResponse } from '@shared/types';
export async function lookupDni(dni: string): Promise<ApiResponse<LookupResponse>> {
  try {
    const response = await fetch('/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dni }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Error: ${response.status} ${response.statusText}`,
      };
    }
    return await response.json();
  } catch (err) {
    console.error('Lookup API Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    };
  }
}