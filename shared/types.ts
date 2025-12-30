export interface DemoItem {
  id: string;
  name: string;
  value: number;
}
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  brand?: string;
}
export interface SourceResult {
  sourceName: string;
  items: string[];
  status: 'success' | 'error';
  message?: string;
  category?: 'Personal' | 'Fiscal' | 'Judicial' | 'Otros';
  metadata?: Record<string, string>;
}
export interface LookupResponse {
  sources: SourceResult[];
  engineVersion?: string;
  searchId: string;
  timestamp: string;
}