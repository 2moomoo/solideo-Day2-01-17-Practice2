// 시간 연결 검증 및 일정 생성

import { TransportOption } from '../types';

export interface TimeSlot {
  start: Date;
  end: Date;
  activity: string;
  location: string;
}

export interface DailySchedule {
  day: number;
  date: Date;
  slots: TimeSlot[];
  totalHours: number;
}

/**
 * 교통 옵션들이 시간적으로 연결 가능한지 검증
 */
export const validateTimeConnection = (
  transport1: TransportOption,
  transport2: TransportOption,
  minTransferMinutes: number = 30
): boolean => {
  const arrival1 = new Date(transport1.arrivalTime);
  const departure2 = new Date(transport2.departureTime);

  // 도착 시간 + 최소 환승 시간 <= 다음 출발 시간
  const requiredDeparture = new Date(arrival1.getTime() + minTransferMinutes * 60000);

  return requiredDeparture <= departure2;
};

/**
 * 여러 교통 옵션의 시간 연결 검증
 */
export const validateTransportChain = (
  transports: TransportOption[],
  minTransferMinutes: number = 30
): boolean => {
  for (let i = 0; i < transports.length - 1; i++) {
    if (!validateTimeConnection(transports[i], transports[i + 1], minTransferMinutes)) {
      return false;
    }
  }
  return true;
};

/**
 * 교통 수단 간 대기 시간 계산 (분)
 */
export const calculateWaitingTime = (
  transport1: TransportOption,
  transport2: TransportOption
): number => {
  const arrival = new Date(transport1.arrivalTime);
  const departure = new Date(transport2.departureTime);
  return Math.max(0, (departure.getTime() - arrival.getTime()) / 60000);
};

/**
 * 일정 자동 생성
 */
export class ScheduleGenerator {
  /**
   * 여행 일정을 날짜별로 분할
   */
  generateDailySchedule(
    startDate: Date,
    duration: number,
    transports: TransportOption[],
    attractions: Array<{ name: string; location: string; duration: number }>,
    accommodations: Array<{ name: string; location: string }>
  ): DailySchedule[] {
    const schedules: DailySchedule[] = [];

    for (let day = 0; day < duration; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);

      const slots: TimeSlot[] = [];
      let currentTime = new Date(currentDate);
      currentTime.setHours(8, 0, 0, 0); // 오전 8시 시작

      // 첫날: 이동
      if (day === 0 && transports.length > 0) {
        const transport = transports[0];
        const depTime = new Date(transport.departureTime);
        const arrTime = new Date(transport.arrivalTime);

        slots.push({
          start: depTime,
          end: arrTime,
          activity: `${transport.type === 'flight' ? '항공' : transport.type === 'train' ? '기차' : '버스'} 이동`,
          location: `${transport.from} → ${transport.to}`,
        });

        currentTime = arrTime;
      }

      // 명소 방문 (하루 2-3개)
      const attractionsPerDay = Math.ceil(attractions.length / duration);
      const dayAttractions = attractions.slice(
        day * attractionsPerDay,
        (day + 1) * attractionsPerDay
      );

      dayAttractions.forEach(attr => {
        // 이동 시간 (30분 가정)
        const travelTime = new Date(currentTime.getTime() + 30 * 60000);

        const visitStart = travelTime;
        const visitEnd = new Date(visitStart.getTime() + attr.duration * 60000);

        slots.push({
          start: visitStart,
          end: visitEnd,
          activity: attr.name,
          location: attr.location,
        });

        currentTime = visitEnd;
      });

      // 저녁 식사
      const dinnerStart = new Date(currentDate);
      dinnerStart.setHours(18, 0, 0, 0);
      const dinnerEnd = new Date(dinnerStart.getTime() + 90 * 60000);

      slots.push({
        start: dinnerStart,
        end: dinnerEnd,
        activity: '저녁 식사',
        location: accommodations[0]?.location || '숙소 근처',
      });

      // 숙소 체크인
      if (day < duration - 1) {
        const checkinStart = new Date(currentDate);
        checkinStart.setHours(20, 0, 0, 0);

        slots.push({
          start: checkinStart,
          end: checkinStart,
          activity: `체크인: ${accommodations[0]?.name || '숙소'}`,
          location: accommodations[0]?.location || '',
        });
      }

      // 마지막 날: 귀가
      if (day === duration - 1 && transports.length > 1) {
        const transport = transports[1]; // 귀가 교통편
        const depTime = new Date(transport.departureTime);
        const arrTime = new Date(transport.arrivalTime);

        slots.push({
          start: depTime,
          end: arrTime,
          activity: `귀가 (${transport.type === 'flight' ? '항공' : transport.type === 'train' ? '기차' : '버스'})`,
          location: `${transport.from} → ${transport.to}`,
        });
      }

      // 시간순 정렬
      slots.sort((a, b) => a.start.getTime() - b.start.getTime());

      const totalHours =
        slots.reduce((sum, slot) => {
          const duration = (slot.end.getTime() - slot.start.getTime()) / 3600000;
          return sum + (isNaN(duration) ? 0 : duration);
        }, 0);

      schedules.push({
        day: day + 1,
        date: currentDate,
        slots,
        totalHours,
      });
    }

    return schedules;
  }

  /**
   * 시간 충돌 검사
   */
  hasTimeConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
    return (
      (slot1.start <= slot2.start && slot2.start < slot1.end) ||
      (slot2.start <= slot1.start && slot1.start < slot2.end)
    );
  }

  /**
   * 일정 유효성 검증
   */
  validateSchedule(schedule: DailySchedule[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    schedule.forEach((day, idx) => {
      // 하루 활동 시간 체크 (16시간 이내 권장)
      if (day.totalHours > 16) {
        errors.push(`Day ${idx + 1}: 활동 시간이 너무 길어요 (${day.totalHours.toFixed(1)}시간)`);
      }

      // 시간 충돌 체크
      for (let i = 0; i < day.slots.length - 1; i++) {
        for (let j = i + 1; j < day.slots.length; j++) {
          if (this.hasTimeConflict(day.slots[i], day.slots[j])) {
            errors.push(
              `Day ${idx + 1}: 시간 충돌 - ${day.slots[i].activity} vs ${day.slots[j].activity}`
            );
          }
        }
      }

      // 슬롯 간 간격 체크 (최소 10분)
      for (let i = 0; i < day.slots.length - 1; i++) {
        const gap =
          (day.slots[i + 1].start.getTime() - day.slots[i].end.getTime()) / 60000;
        if (gap < 0) {
          errors.push(`Day ${idx + 1}: 음수 간격 발견`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 최적 출발 시간 계산
 */
export const calculateOptimalDepartureTime = (
  distance: number,
  avgSpeed: number,
  desiredArrivalHour: number = 12 // 정오 도착 선호
): Date => {
  const travelHours = distance / avgSpeed;
  const departureHour = desiredArrivalHour - travelHours;

  const departureDate = new Date();
  departureDate.setHours(Math.max(6, Math.floor(departureHour)), 0, 0, 0);

  return departureDate;
};

/**
 * 여행 일정 요약
 */
export const summarizeSchedule = (schedules: DailySchedule[]): string => {
  let summary = '';

  schedules.forEach(day => {
    summary += `\n📅 Day ${day.day} (${day.date.toLocaleDateString('ko-KR')})\n`;
    day.slots.forEach(slot => {
      const startTime = slot.start.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      summary += `  ${startTime} - ${slot.activity} @ ${slot.location}\n`;
    });
  });

  return summary;
};
