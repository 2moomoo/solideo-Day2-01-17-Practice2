// Core types for the travel route recommendation system

export interface TravelRequest {
  departure: string;          // 출발 건물/장소
  destination: string;        // 도착 건물/장소
  startDate: string;          // 출발 날짜 (ISO 8601)
  duration: number;           // 여행 기간 (일)
  budget: number;             // 예산 (원)
  preferences: string[];      // 취향 태그 (예: ["자연", "역사", "맛집"])
}

export interface TransportOption {
  type: 'flight' | 'train' | 'bus' | 'subway' | 'walk';
  from: string;
  to: string;
  cost: number;
  duration: number;           // 분
  departureTime: string;
  arrivalTime: string;
}

export interface AccommodationOption {
  name: string;
  location: string;
  costPerNight: number;
  rating: number;
  tags: string[];
}

export interface AttractionOption {
  name: string;
  location: string;
  entranceFee: number;
  duration: number;           // 예상 관람 시간 (분)
  tags: string[];
  rating: number;
}

export interface RouteCandidate {
  id: string;
  transports: TransportOption[];
  accommodations: AccommodationOption[];
  attractions: AttractionOption[];
  totalCost: number;
  totalDuration: number;      // 분
  score: number;              // 종합 점수
  breakdown: CostBreakdown;
}

export interface CostBreakdown {
  transport: number;
  accommodation: number;
  attractions: number;
  total: number;
}

export interface ScoringWeights {
  cost: number;               // 0-1
  time: number;               // 0-1
  preference: number;         // 0-1
  fatigue: number;            // 0-1 (이동 피로도)
}

export interface SearchResult {
  candidates: RouteCandidate[];
  iterations: number;         // 수행된 사이클 수
  weights: ScoringWeights;    // 최종 가중치
}
