// Google Maps API 통합 (무료 $200/월 크레딧)

import { API_CONFIG, hasGoogleMapsKey } from '../config/api';
import { Coordinates } from './geocoding';

/**
 * Google Geocoding API - 주소 → 좌표
 */
export const googleGeocode = async (address: string): Promise<Coordinates | null> => {
  if (!hasGoogleMapsKey()) {
    console.warn('Google Maps API key not configured');
    return null;
  }

  try {
    const url = `${API_CONFIG.GOOGLE_GEOCODING_BASE_URL}/json?` + new URLSearchParams({
      address,
      key: API_CONFIG.GOOGLE_MAPS_KEY,
      language: 'ko',
    });

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 'OK' || !data.results[0]) return null;

    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lon: result.geometry.location.lng,
      display_name: result.formatted_address,
    };
  } catch (error) {
    console.error('Google Geocoding error:', error);
    return null;
  }
};

/**
 * Google Directions API - 경로 탐색
 */
export interface GoogleRouteResult {
  distance: number;      // km
  duration: number;      // 초
  steps: Array<{
    distance: number;
    duration: number;
    instruction: string;
  }>;
  polyline: string;      // 인코딩된 경로
}

export const googleDirections = async (
  origin: Coordinates,
  destination: Coordinates,
  mode: 'driving' | 'transit' | 'walking' = 'driving'
): Promise<GoogleRouteResult | null> => {
  if (!hasGoogleMapsKey()) {
    console.warn('Google Maps API key not configured');
    return null;
  }

  try {
    const url = `${API_CONFIG.GOOGLE_DIRECTIONS_BASE_URL}/json?` + new URLSearchParams({
      origin: `${origin.lat},${origin.lon}`,
      destination: `${destination.lat},${destination.lon}`,
      mode,
      key: API_CONFIG.GOOGLE_MAPS_KEY,
      language: 'ko',
    });

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 'OK' || !data.routes[0]) return null;

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      distance: leg.distance.value / 1000, // m → km
      duration: leg.duration.value,        // 초
      steps: leg.steps.map((step: any) => ({
        distance: step.distance.value / 1000,
        duration: step.duration.value,
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // HTML 태그 제거
      })),
      polyline: route.overview_polyline.points,
    };
  } catch (error) {
    console.error('Google Directions error:', error);
    return null;
  }
};

/**
 * Google Places Nearby Search - 주변 명소 검색
 */
export interface GooglePlace {
  place_id: string;
  name: string;
  types: string[];
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    open_now: boolean;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

export const googlePlacesNearby = async (
  location: Coordinates,
  radiusMeters: number = 10000,
  type?: string // 예: 'tourist_attraction', 'museum', 'park'
): Promise<GooglePlace[]> => {
  if (!hasGoogleMapsKey()) {
    console.warn('Google Maps API key not configured');
    return [];
  }

  try {
    const params: any = {
      location: `${location.lat},${location.lon}`,
      radius: radiusMeters.toString(),
      key: API_CONFIG.GOOGLE_MAPS_KEY,
      language: 'ko',
    };

    if (type) {
      params.type = type;
    }

    const url = `${API_CONFIG.GOOGLE_PLACES_BASE_URL}/nearbysearch/json?` + new URLSearchParams(params);

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (data.status !== 'OK') return [];

    return data.results || [];
  } catch (error) {
    console.error('Google Places error:', error);
    return [];
  }
};

/**
 * Google Places Details - 명소 상세 정보
 */
export const googlePlaceDetails = async (placeId: string): Promise<any | null> => {
  if (!hasGoogleMapsKey()) return null;

  try {
    const url = `${API_CONFIG.GOOGLE_PLACES_BASE_URL}/details/json?` + new URLSearchParams({
      place_id: placeId,
      key: API_CONFIG.GOOGLE_MAPS_KEY,
      language: 'ko',
      fields: 'name,rating,formatted_address,opening_hours,price_level,types,reviews,photos,website',
    });

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    return data.status === 'OK' ? data.result : null;
  } catch (error) {
    console.error('Google Place Details error:', error);
    return null;
  }
};

/**
 * 취향 태그를 Google Places 타입으로 매핑
 */
export const mapPreferencesToGoogleTypes = (preferences: string[]): string[] => {
  const mapping: Record<string, string[]> = {
    '자연': ['park', 'natural_feature'],
    '바다': ['beach', 'aquarium'],
    '산': ['park', 'natural_feature'],
    '역사': ['museum', 'church', 'historical', 'monument'],
    '문화': ['museum', 'art_gallery', 'cultural_center'],
    '예술': ['art_gallery', 'museum'],
    '맛집': ['restaurant', 'cafe', 'food'],
    '쇼핑': ['shopping_mall', 'store'],
    '사진': ['tourist_attraction', 'viewpoint'],
    '액티비티': ['amusement_park', 'stadium', 'gym'],
    '휴식': ['spa', 'park'],
    '럭셔리': ['hotel', 'spa'],
  };

  const types = new Set<string>();
  preferences.forEach(pref => {
    const mapped = mapping[pref] || [];
    mapped.forEach(type => types.add(type));
  });

  return Array.from(types);
};
