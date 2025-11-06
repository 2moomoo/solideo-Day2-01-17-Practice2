// Client-side API service - no backend required
// Uses enhanced search with Google APIs, TSP, time validation, and caching

import { TravelRequest, SearchResult } from '../types';
import { EnhancedRouteSearchService } from './enhancedRouteSearch';

const searchService = new EnhancedRouteSearchService();

/**
 * 경로 검색 (고도화된 클라이언트 사이드 검색)
 *
 * Features:
 * - Google Maps API integration (fallback to OpenStreetMap)
 * - TSP optimization for multi-city routes
 * - Time validation for transport connections
 * - API result caching (1 hour)
 * - Smart weight adjustment
 * - Parallel API calls
 */
export const searchRoutes = async (
  request: TravelRequest,
  onProgress?: (message: string) => void
): Promise<SearchResult> => {
  return await searchService.search(request, onProgress);
};

/**
 * Health check (항상 true, 클라이언트 사이드이므로)
 */
export const checkHealth = async (): Promise<boolean> => {
  return true;
};
