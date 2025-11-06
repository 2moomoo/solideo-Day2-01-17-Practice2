import React, { useState } from 'react';
import { TravelRequest } from '../types';

interface SearchFormProps {
  onSearch: (request: TravelRequest) => void;
  isLoading: boolean;
}

const PREFERENCE_OPTIONS = [
  '자연', '바다', '산', '역사', '문화', '예술',
  '맛집', '쇼핑', '사진', '액티비티', '휴식', '럭셔리'
];

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading }) => {
  const [formData, setFormData] = useState<TravelRequest>({
    departure: '서울',
    destination: '부산',
    startDate: new Date().toISOString().split('T')[0],
    duration: 2,
    budget: 500000,
    preferences: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(formData);
  };

  const handlePreferenceToggle = (pref: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(pref)
        ? prev.preferences.filter(p => p !== pref)
        : [...prev.preferences, pref]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">여행 정보 입력</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 출발지 / 도착지 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              출발지
            </label>
            <input
              type="text"
              value={formData.departure}
              onChange={(e) => setFormData({ ...formData, departure: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 서울"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              도착지
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 부산"
              required
            />
          </div>
        </div>

        {/* 출발일 / 기간 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              출발 날짜
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              여행 기간 (일)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* 예산 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            예산 (원)
          </label>
          <input
            type="number"
            min="0"
            step="10000"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="500000"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.budget.toLocaleString()}원
          </p>
        </div>

        {/* 취향 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            여행 취향 (중복 선택 가능)
          </label>
          <div className="flex flex-wrap gap-2">
            {PREFERENCE_OPTIONS.map(pref => (
              <button
                key={pref}
                type="button"
                onClick={() => handlePreferenceToggle(pref)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  formData.preferences.includes(pref)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
          {formData.preferences.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              선택됨: {formData.preferences.join(', ')}
            </p>
          )}
        </div>

        {/* 검색 버튼 */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? '검색 중...' : '경로 검색'}
        </button>
      </form>
    </div>
  );
};
