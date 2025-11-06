import React from 'react';
import { SearchResult } from '../types';

interface ResultsListProps {
  result: SearchResult | null;
  onSelectRoute: (routeId: string) => void;
  selectedRouteId: string | null;
}

const TRANSPORT_ICONS: Record<string, string> = {
  flight: '✈️',
  train: '🚄',
  bus: '🚌',
  subway: '🚇',
  walk: '🚶'
};

export const ResultsList: React.FC<ResultsListProps> = ({ result, onSelectRoute, selectedRouteId }) => {
  if (!result) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">검색 결과가 없습니다. 위에서 여행 정보를 입력해주세요.</p>
      </div>
    );
  }

  const { candidates, iterations, weights } = result;

  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">조건에 맞는 경로를 찾지 못했습니다. 예산이나 기간을 조정해보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 검색 요약 */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">검색 완료</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• 총 {candidates.length}개의 경로를 찾았습니다</p>
          <p>• {iterations}번의 최적화 사이클 수행</p>
          <p className="text-xs text-blue-600 mt-2">
            가중치: 비용 {(weights.cost * 100).toFixed(0)}% / 시간 {(weights.time * 100).toFixed(0)}% /
            취향 {(weights.preference * 100).toFixed(0)}% / 피로도 {(weights.fatigue * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* 경로 리스트 */}
      {candidates.map((candidate, index) => (
        <div
          key={candidate.id}
          onClick={() => onSelectRoute(candidate.id)}
          className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all hover:shadow-lg ${
            selectedRouteId === candidate.id ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800">
                  경로 #{index + 1}
                </h3>
                {index === 0 && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">
                    추천
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                점수: {(candidate.score * 100).toFixed(1)}점
              </p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {candidate.totalCost.toLocaleString()}원
              </p>
              <p className="text-sm text-gray-500">
                {Math.floor(candidate.totalDuration / 60)}시간 {candidate.totalDuration % 60}분
              </p>
            </div>
          </div>

          {/* 비용 분해 */}
          <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded">
            <div>
              <p className="text-xs text-gray-500">교통비</p>
              <p className="font-semibold text-gray-800">
                {candidate.breakdown.transport.toLocaleString()}원
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">숙박비</p>
              <p className="font-semibold text-gray-800">
                {candidate.breakdown.accommodation.toLocaleString()}원
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">입장료</p>
              <p className="font-semibold text-gray-800">
                {candidate.breakdown.attractions.toLocaleString()}원
              </p>
            </div>
          </div>

          {/* 교통 */}
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">교통</h4>
            <div className="space-y-2">
              {candidate.transports.map((transport, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="text-xl">{TRANSPORT_ICONS[transport.type]}</span>
                  <span className="text-gray-700">
                    {transport.from} → {transport.to}
                  </span>
                  <span className="text-gray-500">
                    ({Math.floor(transport.duration / 60)}시간 {transport.duration % 60}분)
                  </span>
                  <span className="ml-auto font-medium text-gray-800">
                    {transport.cost.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 숙소 */}
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">숙소</h4>
            <div className="space-y-2">
              {candidate.accommodations.map((acc, idx) => (
                <div key={idx} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{acc.name}</span>
                    <span className="text-gray-600">
                      ⭐ {acc.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>{acc.location}</span>
                    <span>{acc.costPerNight.toLocaleString()}원/박</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {acc.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 명소 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">추천 명소</h4>
            <div className="grid grid-cols-2 gap-2">
              {candidate.attractions.map((attr, idx) => (
                <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{attr.name}</span>
                    <span className="text-xs text-gray-600">⭐ {attr.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {attr.entranceFee > 0 ? `${attr.entranceFee.toLocaleString()}원` : '무료'}
                    {' • '}
                    {Math.floor(attr.duration / 60)}시간
                  </div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {attr.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
