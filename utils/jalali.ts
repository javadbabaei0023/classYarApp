import moment from 'moment-jalaali';

moment.loadPersian({ usePersianDigits: true, dialect: 'persian-modern' });

export const getTodayJalali = (): string => {
  return moment().format('jYYYY/jMM/jDD');
};

export const getWeekday = (jalaliDate: string): string => {
  return moment(jalaliDate, 'jYYYY/jMM/jDD').format('dddd');
};

export const formatJalali = (dateStr: string): string => {
  return moment(dateStr, 'jYYYY/jMM/jDD').format('jD jMMMM jYYYY');
};

export const toGregorian = (jalaliDate: string): string => {
    return moment(jalaliDate, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');
}

export const subtractDays = (dateStr: string, days: number): string => {
    return moment(dateStr, 'jYYYY/jMM/jDD').subtract(days, 'days').format('jYYYY/jMM/jDD');
}

// Helper to generate last 7 days for charts
export const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        days.push(moment().subtract(i, 'days').format('jYYYY/jMM/jDD'));
    }
    return days;
};