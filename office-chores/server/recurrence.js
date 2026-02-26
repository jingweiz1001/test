const {
  addDays,
  addWeeks,
  addMonths,
  isAfter,
  isBefore,
  isEqual,
  parseISO,
  format,
  getDay,
  setDate,
  getDaysInMonth,
} = require('date-fns');

/**
 * Given a chore row and a date range [rangeStart, rangeEnd] (inclusive),
 * returns sorted ISO date strings for all occurrences within that range.
 *
 * @param {Object} chore - row from chores table
 * @param {string} rangeStart - "YYYY-MM-DD"
 * @param {string} rangeEnd   - "YYYY-MM-DD"
 * @returns {string[]}
 */
function expandOccurrences(chore, rangeStart, rangeEnd) {
  const start = parseISO(rangeStart);
  const end = parseISO(rangeEnd);
  const choreStart = parseISO(chore.start_date);
  const choreEnd = chore.end_date ? parseISO(chore.end_date) : null;

  const inRange = (d) => {
    const afterOrEqStart = isAfter(d, start) || isEqual(d, start);
    const beforeOrEqEnd = isBefore(d, end) || isEqual(d, end);
    const afterOrEqChoreStart = isAfter(d, choreStart) || isEqual(d, choreStart);
    const beforeOrEqChoreEnd = choreEnd ? (isBefore(d, choreEnd) || isEqual(d, choreEnd)) : true;
    return afterOrEqStart && beforeOrEqEnd && afterOrEqChoreStart && beforeOrEqChoreEnd;
  };

  const fmt = (d) => format(d, 'yyyy-MM-dd');

  switch (chore.recurrence_type) {
    case 'none':
    case null: {
      if (inRange(choreStart)) return [fmt(choreStart)];
      return [];
    }

    case 'daily': {
      const results = [];
      const interval = chore.recurrence_interval || 1;
      let current = choreStart;
      // Advance to range start efficiently
      while (isBefore(current, start)) {
        current = addDays(current, interval);
      }
      while (isBefore(current, end) || isEqual(current, end)) {
        if (inRange(current)) results.push(fmt(current));
        current = addDays(current, interval);
      }
      return results;
    }

    case 'weekly': {
      const results = [];
      const interval = chore.recurrence_interval || 1;
      const daysOfWeek = chore.recurrence_days_of_week
        ? JSON.parse(chore.recurrence_days_of_week)
        : [getDay(choreStart)];

      // Start from the Monday of the chore start week
      let weekCursor = choreStart;
      // Advance week cursor until we're near the range
      while (isBefore(addDays(weekCursor, 7 * interval), start)) {
        weekCursor = addWeeks(weekCursor, interval);
      }
      // Go back one interval to ensure we don't miss anything at boundary
      weekCursor = addWeeks(weekCursor, -interval);
      if (isBefore(weekCursor, choreStart)) weekCursor = choreStart;

      // Now iterate week by week
      const rangeEndPlusBuffer = addDays(end, 1);
      let safetyLimit = 0;
      while (isBefore(weekCursor, rangeEndPlusBuffer) && safetyLimit < 1000) {
        safetyLimit++;
        // Within this week, emit each matching day
        for (const dow of daysOfWeek) {
          const weekStart = getWeekStart(weekCursor);
          const candidate = addDays(weekStart, dow);
          if (inRange(candidate)) {
            const key = fmt(candidate);
            if (!results.includes(key)) results.push(key);
          }
        }
        weekCursor = addWeeks(weekCursor, interval);
      }
      return results.sort();
    }

    case 'monthly': {
      const results = [];
      const interval = chore.recurrence_interval || 1;
      const dayOfMonth = chore.recurrence_day_of_month || choreStart.getDate();

      let monthCursor = choreStart;
      // Advance to near range start
      while (isBefore(addMonths(monthCursor, interval), start)) {
        monthCursor = addMonths(monthCursor, interval);
      }
      monthCursor = addMonths(monthCursor, -interval);
      if (isBefore(monthCursor, choreStart)) monthCursor = choreStart;

      const rangeEndPlusBuffer = addDays(end, 1);
      let safetyLimit = 0;
      while (isBefore(monthCursor, rangeEndPlusBuffer) && safetyLimit < 500) {
        safetyLimit++;
        const daysInMonth = getDaysInMonth(monthCursor);
        if (dayOfMonth <= daysInMonth) {
          const candidate = setDate(monthCursor, dayOfMonth);
          if (inRange(candidate)) results.push(fmt(candidate));
        }
        monthCursor = addMonths(monthCursor, interval);
      }
      return results.sort();
    }

    default:
      return [];
  }
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  return d;
}

module.exports = { expandOccurrences };
