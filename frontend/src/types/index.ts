// Frontend types (matching backend types)

export interface TravelRequest {
  departure: string;
  destination: string;
  startDate: string;
  duration: number;
  budget: number;
  preferences: string[];
}

export interface TransportOption {
  type: 'flight' | 'train' | 'bus' | 'subway' | 'walk';
  from: string;
  to: string;
  cost: number;
  duration: number;
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
  duration: number;
  tags: string[];
  rating: number;
}

export interface RouteCandidate {
  id: string;
  transports: TransportOption[];
  accommodations: AccommodationOption[];
  attractions: AttractionOption[];
  totalCost: number;
  totalDuration: number;
  score: number;
  breakdown: CostBreakdown;
}

export interface CostBreakdown {
  transport: number;
  accommodation: number;
  attractions: number;
  total: number;
}

export interface ScoringWeights {
  cost: number;
  time: number;
  preference: number;
  fatigue: number;
}

export interface SearchResult {
  candidates: RouteCandidate[];
  iterations: number;
  weights: ScoringWeights;
}
