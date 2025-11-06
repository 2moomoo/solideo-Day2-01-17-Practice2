# 🌍 Travel Route Recommendation App

비용 고려형 여행 개인화 앱 - 실시간 API 연동 및 다단계 사이클 기반 최적 경로 추천

## ✨ 주요 특징

- **🚫 서버 불필요** - 순수 클라이언트 사이드 애플리케이션
- **🌐 실시간 API 연동** - OpenTripMap, OpenRouteService, Nominatim 사용
- **💰 동적 비용 계산** - 거리 기반 실시간 계산 (하드코딩 없음)
- **🔄 다단계 최적화** - 반복적 가중치 조정으로 최적 경로 탐색
- **🗺️ 실시간 지도** - Leaflet + OpenStreetMap으로 경로 시각화

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/       # UI 컴포넌트
│   │   ├── SearchForm.tsx
│   │   ├── ResultsList.tsx
│   │   └── MapView.tsx
│   ├── services/         # 비즈니스 로직
│   │   ├── api.ts                    # API 통합
│   │   ├── routeSearchService.ts     # 경로 탐색 알고리즘
│   │   ├── geocoding.ts              # Nominatim 지오코딩
│   │   ├── routing.ts                # OpenRouteService 경로
│   │   ├── attractions.ts            # OpenTripMap 명소
│   │   └── costCalculator.ts         # 동적 비용 계산
│   ├── config/
│   │   └── api.ts                    # API 설정
│   ├── types/
│   │   └── index.ts                  # TypeScript 타입
│   └── App.tsx
└── package.json
```

## 🔌 사용 중인 무료 API

| API | 용도 | 공식 문서 |
|-----|------|----------|
| **OpenTripMap** | 관광지/명소 정보 | https://opentripmap.io/docs |
| **OpenRouteService** | 경로 탐색 및 거리 계산 | https://openrouteservice.org/dev |
| **Nominatim (OSM)** | 지오코딩/역지오코딩 | https://nominatim.org/release-docs/latest |

## 🎯 주요 기능

### 1️⃣ 검색 입력
- 출발지/도착지 (자동 지오코딩)
- 여행 기간 (일)
- 예산 (원)
- 취향 태그 (자연, 바다, 역사, 문화, 맛집 등)

### 2️⃣ 실시간 데이터 수집
- **Nominatim**: 주소 → 좌표 변환
- **OpenRouteService**: 실제 도로 경로 및 거리 계산
- **OpenTripMap**: 목적지 주변 명소 검색

### 3️⃣ 동적 비용 계산
```typescript
// 하드코딩이 아닌 계산식 기반
교통비 = 거리(km) × 교통수단별_단가 × 할인율
숙박비 = 박당_기본요금 × 박수 × 지역할증 × 장기할인
명소비 = 카테고리별_추정요금 (인기도 반영)
```

### 4️⃣ 다단계 최적화
- 최대 3회 반복 탐색
- 예산 활용도에 따른 가중치 자동 조정
- 비용/시간/취향 균형 최적화

### 5️⃣ 결과 시각화
- 경로별 비용 분해 (교통/숙박/명소)
- 실시간 지도 표시
- 명소 정보 및 태그

## 🧠 핵심 알고리즘

```
[사용자 입력]
    ↓
[지오코딩] → 좌표 획득
    ↓
[경로 API] → 실제 거리/시간
    ↓
[명소 API] → 실시간 관광지 정보
    ↓
┌─────────────────────────────────┐
│  다단계 사이클 (최대 3회)        │
│  1. 교통 옵션 생성 (거리 기반)   │
│  2. 숙박 옵션 생성 (예산 기반)   │
│  3. 명소 선택 (취향 매칭)        │
│  4. 조합 생성 및 비용 계산       │
│  5. 스코어링 (가중치 적용)       │
│  6. 가중치 조정                  │
└─────────────────────────────────┘
    ↓
[상위 5개 경로] → 사용자에게 표시
```

## 💡 비용 계산 로직

### 교통비
```javascript
// 거리별 교통수단 추천
300km 이상 → 항공 (150원/km + 공항세 15,000원)
50km 이상 → 기차 (80원/km)
30km 이상 → 버스 (50원/km)
500km 이하 → 자가용 (100원/km)

// 장거리 할인
500km 이상 → 15% 할인
300-500km → 10% 할인
100-300km → 5% 할인
```

### 숙박비
```javascript
// 등급별 기본 요금
게스트하우스: 50,000원/박
비즈니스 호텔: 80,000원/박
프리미엄 호텔: 150,000원/박

// 할증/할인
인기 관광지 → +30%
3박 이상 → -5%
```

### 명소 입장료
```javascript
// 카테고리별 추정
공원/자연/해변 → 무료
교회/기념비 → 5,000원
박물관/궁전 (인기도 3-5) → 10,000원
테마파크/동물원 (인기도 5-7) → 20,000원
```

## 🔧 기술 스택

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Map**: Leaflet, React-Leaflet
- **APIs**: OpenTripMap, OpenRouteService, Nominatim (모두 무료)

## 🌐 API 키 설정 (선택사항)

기본 API 키가 포함되어 있어 즉시 사용 가능하지만, 더 높은 사용량을 원하면:

1. `.env` 파일 생성:
```bash
cp frontend/.env.example frontend/.env
```

2. API 키 발급:
- OpenTripMap: https://opentripmap.io/register
- OpenRouteService: https://openrouteservice.org/dev/#/signup

3. `.env` 파일에 키 입력

## 🎮 사용 예시

1. **입력**
   - 출발지: 서울
   - 도착지: 부산
   - 기간: 2일
   - 예산: 500,000원
   - 취향: 바다, 맛집, 역사

2. **결과**
   - 교통: KTX (59,800원 × 2) ← 실제 거리 325km 기반
   - 숙박: 해운대 호텔 (120,000원/박 × 2박)
   - 명소: 해운대, 자갈치시장, 감천문화마을 등 (실시간 API)
   - 총비용: 약 370,000원
   - 점수: 87.3점

## 📈 향후 개선 계획

- [ ] 실제 항공/기차 요금 API 연동 (Skyscanner, Amadeus)
- [ ] 실제 숙박 API 연동 (Booking.com, Airbnb)
- [ ] 경로 최적화 알고리즘 고도화 (TSP)
- [ ] 시간대 고려 (출발/도착 시간 연결)
- [ ] 날씨 정보 추가
- [ ] 검색 이력 저장 (localStorage)
- [ ] PWA 변환 (오프라인 지원)

## 📝 License

Apache License 2.0
