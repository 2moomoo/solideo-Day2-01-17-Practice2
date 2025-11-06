// API 설정 및 환경 변수 - 모두 무료 tier 사용

export const API_CONFIG = {
  // === Google APIs (무료 $200/월 크레딧) ===
  // 발급: https://console.cloud.google.com/apis/credentials
  GOOGLE_MAPS_KEY: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
  GOOGLE_PLACES_BASE_URL: 'https://maps.googleapis.com/maps/api/place',
  GOOGLE_DIRECTIONS_BASE_URL: 'https://maps.googleapis.com/maps/api/directions',
  GOOGLE_GEOCODING_BASE_URL: 'https://maps.googleapis.com/maps/api/geocode',

  // === OpenTripMap - 관광지/명소 (무료) ===
  OPENTRIPMAP_KEY: import.meta.env.VITE_OPENTRIPMAP_KEY || '5ae2e3f221c38a28845f05b6a2c6e8fb5dc7a5e8b0a9c0ff09c9c19d',
  OPENTRIPMAP_BASE_URL: 'https://api.opentripmap.com/0.1',

  // === OpenRouteService - 경로 탐색 (무료) ===
  OPENROUTE_KEY: import.meta.env.VITE_OPENROUTE_KEY || '5b3ce3597851110001cf6248d8f5c7b8e2e9487cb4a87fe2d20e7d9f',
  OPENROUTE_BASE_URL: 'https://api.openrouteservice.org/v2',

  // === Nominatim - 지오코딩 (무료, OpenStreetMap) ===
  NOMINATIM_BASE_URL: 'https://nominatim.openstreetmap.org',

  // === HERE Maps API - 대안 경로 (무료 tier) ===
  // 발급: https://developer.here.com/
  HERE_API_KEY: import.meta.env.VITE_HERE_API_KEY || '',
  HERE_BASE_URL: 'https://router.hereapi.com/v8',

  // === Amadeus Travel API - 여행 정보 (무료 tier) ===
  // 발급: https://developers.amadeus.com/
  AMADEUS_API_KEY: import.meta.env.VITE_AMADEUS_API_KEY || '',
  AMADEUS_API_SECRET: import.meta.env.VITE_AMADEUS_API_SECRET || '',
  AMADEUS_BASE_URL: 'https://test.api.amadeus.com/v1',

  // === Weatherbit - 날씨 (무료 tier) ===
  WEATHERBIT_KEY: import.meta.env.VITE_WEATHERBIT_KEY || '',
  WEATHERBIT_BASE_URL: 'https://api.weatherbit.io/v2.0',

  // API 우선순위 (fallback 순서)
  GEOCODING_PRIORITY: ['google', 'nominatim'] as const,
  ROUTING_PRIORITY: ['google', 'openroute', 'here'] as const,
  PLACES_PRIORITY: ['google', 'opentripmap'] as const,
};

// 비용 계산 상수 (시장 평균 기반)
export const COST_CONSTANTS = {
  // 교통비 (원/km)
  TRANSPORT: {
    flight: 150,      // 항공: 약 150원/km
    train: 80,        // KTX: 약 80원/km
    bus: 50,          // 고속버스: 약 50원/km
    car: 100,         // 자가용: 유류비+톨비 약 100원/km
  },

  // 속도 (km/h)
  SPEED: {
    flight: 500,      // 순항속도 (대기시간 제외)
    train: 200,       // KTX 평균
    bus: 80,          // 고속버스 평균
    car: 90,          // 자가용 고속도로 평균
  },

  // 대기/준비 시간 (분)
  WAITING_TIME: {
    flight: 120,      // 체크인+보안검색+보딩
    train: 30,        // 승차권 발권+플랫폼 이동
    bus: 20,          // 티켓 구매+승차
    car: 0,           // 즉시 출발
  },

  // 숙박비 (원/박) - 거리 기반 등급 차등
  ACCOMMODATION: {
    budget: 50000,    // 게스트하우스/모텔
    standard: 80000,  // 비즈니스 호텔
    premium: 150000,  // 특급 호텔
  },

  // 명소 입장료 평균 (원)
  ATTRACTION_FEE: {
    free: 0,
    cheap: 5000,
    standard: 10000,
    premium: 20000,
  },

  // 식비 (원/일/인)
  MEAL_COST_PER_DAY: 30000,

  // 기타 비용 비율
  MISC_COST_RATIO: 0.1, // 총 비용의 10%
};

// API 요청 헤더
export const getHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
});

// API 키 유효성 체크
export const hasGoogleMapsKey = (): boolean => {
  return !!API_CONFIG.GOOGLE_MAPS_KEY && API_CONFIG.GOOGLE_MAPS_KEY.length > 10;
};

export const hasHereKey = (): boolean => {
  return !!API_CONFIG.HERE_API_KEY && API_CONFIG.HERE_API_KEY.length > 10;
};

export const hasAmadeusKey = (): boolean => {
  return !!API_CONFIG.AMADEUS_API_KEY && API_CONFIG.AMADEUS_API_KEY.length > 10;
};
