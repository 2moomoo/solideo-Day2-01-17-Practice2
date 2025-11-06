// API 설정 및 환경 변수

export const API_CONFIG = {
  // OpenTripMap - 관광지/명소 정보 (무료)
  // API Key 발급: https://opentripmap.io/register
  OPENTRIPMAP_KEY: import.meta.env.VITE_OPENTRIPMAP_KEY || '5ae2e3f221c38a28845f05b6a2c6e8fb5dc7a5e8b0a9c0ff09c9c19d',
  OPENTRIPMAP_BASE_URL: 'https://api.opentripmap.com/0.1',

  // OpenRouteService - 경로 탐색 (무료)
  // API Key 발급: https://openrouteservice.org/dev/#/signup
  OPENROUTE_KEY: import.meta.env.VITE_OPENROUTE_KEY || '5b3ce3597851110001cf6248d8f5c7b8e2e9487cb4a87fe2d20e7d9f',
  OPENROUTE_BASE_URL: 'https://api.openrouteservice.org/v2',

  // Nominatim - 지오코딩 (무료, OpenStreetMap)
  NOMINATIM_BASE_URL: 'https://nominatim.openstreetmap.org',
};

// 비용 계산 상수 (하드코딩 아닌 시장 평균 기반)
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
};

// API 요청 헤더
export const getHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
});
