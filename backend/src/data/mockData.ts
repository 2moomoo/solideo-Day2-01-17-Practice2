// Mock data for MVP - 실제 API 연동 전 테스트용 데이터

import { TransportOption, AccommodationOption, AttractionOption } from '../types';

export const mockTransports: TransportOption[] = [
  // 서울 -> 부산
  {
    type: 'flight',
    from: '김포공항',
    to: '김해공항',
    cost: 89000,
    duration: 65,
    departureTime: '2024-01-15T08:00:00',
    arrivalTime: '2024-01-15T09:05:00'
  },
  {
    type: 'train',
    from: '서울역',
    to: '부산역',
    cost: 59800,
    duration: 155,
    departureTime: '2024-01-15T06:00:00',
    arrivalTime: '2024-01-15T08:35:00'
  },
  {
    type: 'bus',
    from: '서울고속버스터미널',
    to: '부산종합버스터미널',
    cost: 35000,
    duration: 240,
    departureTime: '2024-01-15T07:00:00',
    arrivalTime: '2024-01-15T11:00:00'
  },
  // 부산 -> 경주
  {
    type: 'bus',
    from: '부산역',
    to: '경주',
    cost: 12000,
    duration: 90,
    departureTime: '2024-01-15T10:00:00',
    arrivalTime: '2024-01-15T11:30:00'
  },
  {
    type: 'train',
    from: '부산역',
    to: '경주역',
    cost: 18000,
    duration: 60,
    departureTime: '2024-01-15T10:30:00',
    arrivalTime: '2024-01-15T11:30:00'
  }
];

export const mockAccommodations: AccommodationOption[] = [
  {
    name: '해운대 오션뷰 호텔',
    location: '부산 해운대',
    costPerNight: 120000,
    rating: 4.5,
    tags: ['바다', '럭셔리', '조식포함']
  },
  {
    name: '부산역 비즈니스 호텔',
    location: '부산 중구',
    costPerNight: 65000,
    rating: 4.0,
    tags: ['접근성', '가성비']
  },
  {
    name: '경주 한옥 게스트하우스',
    location: '경주 황남동',
    costPerNight: 45000,
    rating: 4.7,
    tags: ['역사', '전통', '문화']
  },
  {
    name: '남포동 시티 호텔',
    location: '부산 중구',
    costPerNight: 80000,
    rating: 4.2,
    tags: ['맛집', '쇼핑', '야경']
  }
];

export const mockAttractions: AttractionOption[] = [
  {
    name: '해운대 해수욕장',
    location: '부산 해운대',
    entranceFee: 0,
    duration: 120,
    tags: ['바다', '자연', '사진'],
    rating: 4.6
  },
  {
    name: '감천문화마을',
    location: '부산 사하구',
    entranceFee: 0,
    duration: 90,
    tags: ['문화', '예술', '사진'],
    rating: 4.5
  },
  {
    name: '불국사',
    location: '경주',
    entranceFee: 6000,
    duration: 120,
    tags: ['역사', '문화', '사찰'],
    rating: 4.8
  },
  {
    name: '석굴암',
    location: '경주',
    entranceFee: 6000,
    duration: 90,
    tags: ['역사', '문화', '유네스코'],
    rating: 4.7
  },
  {
    name: '자갈치 시장',
    location: '부산 중구',
    entranceFee: 0,
    duration: 120,
    tags: ['맛집', '해산물', '전통시장'],
    rating: 4.4
  },
  {
    name: '첨성대',
    location: '경주',
    entranceFee: 0,
    duration: 30,
    tags: ['역사', '천문', '야경'],
    rating: 4.3
  }
];

// 지역별 명소 매핑
export const attractionsByLocation: Record<string, AttractionOption[]> = {
  '부산': mockAttractions.filter(a => a.location.includes('부산')),
  '경주': mockAttractions.filter(a => a.location.includes('경주'))
};

// 숙소별 근처 명소 매핑
export const nearbyAttractions: Record<string, string[]> = {
  '해운대 오션뷰 호텔': ['해운대 해수욕장'],
  '부산역 비즈니스 호텔': ['자갈치 시장'],
  '남포동 시티 호텔': ['자갈치 시장', '감천문화마을'],
  '경주 한옥 게스트하우스': ['불국사', '석굴암', '첨성대']
};
