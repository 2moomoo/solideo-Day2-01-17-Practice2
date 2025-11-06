# 🌍 Travel Route Recommendation App

비용 고려형 여행 개인화 앱 - 다단계 사이클 기반 최적 경로 추천

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
├── backend/          # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Core business logic (route search, scoring)
│   │   ├── types/    # TypeScript types
│   │   └── utils/    # Utility functions
│   └── package.json
│
└── frontend/         # React + TypeScript + Vite
    ├── src/
    │   ├── components/  # UI components
    │   ├── services/    # API calls
    │   ├── types/       # TypeScript types
    │   └── App.tsx
    └── package.json
```

## 🎯 MVP Features

- ✅ Basic input form (출발지, 도착지, 기간, 예산, 취향)
- ✅ Multi-cycle route search algorithm
- ✅ Scoring system (비용, 시간, 취향 일치도)
- ✅ Results list view with cost breakdown
- ✅ Basic map visualization

## 🧠 Core Algorithm

다단계 사이클 구조:
1. 데이터 수집 (Mock API)
2. 1차 필터 (예산, 기간 기반)
3. 조합 생성 (교통수단 조합)
4. 시뮬레이션 (비용, 시간 계산)
5. 평가·스코어링
6. 반복 탐색 (가중치 조정)

## 📊 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Leaflet
- **Backend**: Node.js, Express, TypeScript
- **Dev Tools**: ESLint, Prettier

## 📝 License

Apache License 2.0
