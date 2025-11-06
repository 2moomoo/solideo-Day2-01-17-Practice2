// Client-side API service - no backend required

import { TravelRequest, SearchResult } from '../types';
import { ClientRouteSearchService } from './routeSearchService';

const searchService = new ClientRouteSearchService();

/**
 * 경로 검색 (클라이언트 사이드)
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
