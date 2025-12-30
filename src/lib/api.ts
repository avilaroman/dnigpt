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
        error: errorData.error || `Error HTTP: ${response.status}`,
      };
    }
    const json = await response.json();
    return json as ApiResponse<LookupResponse>;
  } catch (err) {
    console.error('Lookup API Client Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado de red',
    };
  }
}