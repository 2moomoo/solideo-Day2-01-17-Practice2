// OpenTripMap API - 관광지/명소 정보

import { API_CONFIG } from '../config/api';
import { Coordinates } from './geocoding';

export interface Attraction {
  xid: string;
  name: string;
  kinds: string;           // 카테고리 (예: "museums,cultural")
  point: {
    lat: number;
    lon: number;
  };
  dist?: number;           // 검색 중심점으로부터의 거리 (m)
  rate?: number;           // 인기도 (1-7)
}

export interface AttractionDetail {
  xid: string;
  name: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    road?: string;
    house_number?: string;
  };
  rate: number;
  kinds: string;
  sources: {
    description?: string;
    attributes?: string[];
  };
  otm?: string;            // OpenTripMap URL
  preview?: {
    source: string;
    height: number;
    width: number;
  };
  wikipedia?: string;
  image?: string;
  point: {
    lat: number;
    lon: number;
  };
}

/**
 * 특정 위치 주변 명소 검색
 */
export const searchAttractions = async (
  coords: Coordinates,
  radiusKm: number = 10,
  kinds?: string // 예: "museums", "cultural", "natural", "historic"
): Promise<Attraction[]> => {
  try {
    const params = new URLSearchParams({
      lon: coords.lon.toString(),
      lat: coords.lat.toString(),
      radius: (radiusKm * 1000).toString(), // km → m
      limit: '50',
      format: 'json',
      apikey: API_CONFIG.OPENTRIPMAP_KEY,
    });

    if (kinds) {
      params.append('kinds', kinds);
    }

    const url = `${API_CONFIG.OPENTRIPMAP_BASE_URL}/en/places/radius?${params}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OpenTripMap API error: ${response.statusText}`);
    }

    const data = await response.json();

    // 이름이 있는 것만 필터링 (무명 장소 제외)
    return data.filter((item: Attraction) => item.name && item.name.trim() !== '');
  } catch (error) {
    console.error('Attraction search error:', error);
    return [];
  }
};

/**
 * 특정 명소의 상세 정보 조회
 */
export const getAttractionDetail = async (xid: string): Promise<AttractionDetail | null> => {
  try {
    const url = `${API_CONFIG.OPENTRIPMAP_BASE_URL}/en/places/xid/${xid}?apikey=${API_CONFIG.OPENTRIPMAP_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OpenTripMap detail API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Attraction detail error:', error);
    return null;
  }
};

/**
 * 카테고리별 명소 필터링
 */
export const filterAttractionsByCategory = (
  attractions: Attraction[],
  categories: string[]
): Attraction[] => {
  if (categories.length === 0) {
    return attractions;
  }

  return attractions.filter(attraction => {
    const kinds = attraction.kinds.toLowerCase().split(',');
    return categories.some(cat =>
      kinds.some(kind => kind.includes(cat.toLowerCase()))
    );
  });
};

/**
 * 취향 태그를 OpenTripMap 카테고리로 매핑
 */
export const mapPreferencesToKinds = (preferences: string[]): string => {
  const mapping: Record<string, string[]> = {
    '자연': ['natural', 'nature_reserves', 'beaches', 'geological_formations'],
    '바다': ['beaches', 'coastal'],
    '산': ['natural', 'peaks', 'alpine'],
    '역사': ['historic', 'archaeology', 'fortifications', 'monuments'],
    '문화': ['cultural', 'theatres_and_entertainments', 'museums'],
    '예술': ['museums', 'galleries', 'architecture'],
    '맛집': ['foods', 'restaurants'],
    '쇼핑': ['shops', 'malls'],
    '사진': ['view_points', 'tourist_facilities'],
    '액티비티': ['sport', 'amusements', 'adventure'],
    '휴식': ['natural', 'parks', 'gardens'],
    '럭셔리': ['hotels', 'resorts'],
  };

  const kinds = new Set<string>();

  preferences.forEach(pref => {
    const mapped = mapping[pref] || [];
    mapped.forEach(kind => kinds.add(kind));
  });

  return Array.from(kinds).join(',');
};
