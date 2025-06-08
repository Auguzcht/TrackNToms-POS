/**
 * Format a date range as a readable string
 * @param {string|Date} startDate - Start date of the range
 * @param {string|Date} endDate - End date of the range
 * @returns {string} Formatted date range string
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) return 'All Time';
  
  const formatDate = (date) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (startDate && !endDate) return `Since ${formatDate(startDate)}`;
  if (!startDate && endDate) return `Until ${formatDate(endDate)}`;
  
  // Check if startDate and endDate are the same day
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  ) {
    return formatDate(startDate);
  }
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

/**
 * Get date X days/weeks/months ago
 * @param {number} value - Number of units to go back
 * @param {string} unit - Unit of time (day, week, month, year)
 * @returns {Date} Date object representing the past date
 */
export const getDateXAgo = (value, unit = 'day') => {
  const date = new Date();
  
  switch (unit.toLowerCase()) {
    case 'day':
      date.setDate(date.getDate() - value);
      break;
    case 'week':
      date.setDate(date.getDate() - (value * 7));
      break;
    case 'month':
      date.setMonth(date.getMonth() - value);
      break;
    case 'year':
      date.setFullYear(date.getFullYear() - value);
      break;
    default:
      throw new Error(`Invalid unit: ${unit}. Use day, week, month, or year.`);
  }
  
  return date;
};

/**
 * Format a date as ISO string (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} ISO formatted date string
 */
export const formatDateISO = (date) => {
  if (!date) return null;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};

/**
 * Get the start and end of a time period
 * @param {string} period - Period identifier (today, yesterday, thisWeek, etc.)
 * @returns {Object} Object containing startDate and endDate
 */
export const getPeriodRange = (period) => {
  const today = new Date();
  let startDate, endDate;
  
  switch (period) {
    case 'today':
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      endDate = today;
      break;
      
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      endDate = yesterday;
      break;
      
    case 'thisWeek':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
      startDate = startOfWeek;
      endDate = today;
      break;
      
    case 'lastWeek':
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7); // Start of last week (Sunday)
      const lastWeekEnd = new Date(today);
      lastWeekEnd.setDate(today.getDate() - today.getDay() - 1); // End of last week (Saturday)
      startDate = lastWeekStart;
      endDate = lastWeekEnd;
      break;
      
    case 'thisMonth':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = today;
      break;
      
    case 'lastMonth':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
      
    case 'last30Days':
      startDate = getDateXAgo(30);
      endDate = today;
      break;
      
    case 'last90Days':
      startDate = getDateXAgo(90);
      endDate = today;
      break;
      
    case 'thisYear':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = today;
      break;
      
    default:
      startDate = null;
      endDate = null;
      break;
  }
  
  return {
    startDate: startDate ? formatDateISO(startDate) : null,
    endDate: endDate ? formatDateISO(endDate) : null
  };
};