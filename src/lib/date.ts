/**
 * Date utility functions for RFI dashboard
 */

export function formatDate(dateInput: string | number | undefined): string {
  if (!dateInput) return '';
  
  let date: Date;
  
  if (typeof dateInput === 'number') {
    // Handle timestamp (milliseconds)
    date = new Date(dateInput);
  } else {
    // Handle string date
    date = new Date(dateInput);
  }
  
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateInput: string | number | undefined): string {
  if (!dateInput) return '';
  
  let date: Date;
  
  if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else {
    date = new Date(dateInput);
  }
  
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function getLastUpdatedTimestamp(rows: Array<{ last_change_of_court: string }>): string {
  const validDates = rows
    .map(row => row.last_change_of_court)
    .filter(date => date && date !== 'N/A')
    .map(date => new Date(date))
    .filter(date => !isNaN(date.getTime()));
  
  if (validDates.length === 0) return 'Never';
  
  const latest = new Date(Math.max(...validDates.map(d => d.getTime())));
  return formatDateTime(latest);
}

export function getDaysLateStyling(daysLate: number): string {
  if (daysLate <= 0) {
    return '';
  } else if (daysLate < 3) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
  } else if (daysLate < 10) {
    return 'bg-orange-200 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200';
  } else {
    return 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200';
  }
}
