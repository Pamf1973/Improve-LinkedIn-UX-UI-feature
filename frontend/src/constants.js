export function postedLabel(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days <= 30) return `${days}d ago`;
  if (days <= 365) return `${Math.floor(days / 30)}mo ago`;
  return 'Over a year ago';
}

export function logoUrl(name, raw) {
  if (raw && raw.startsWith('http')) return raw;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0a66c2&color=fff&size=100&bold=true`;
}

export const TOAST_ICONS = {
  success: 'fa-check',
  error: 'fa-times',
  archive: 'fa-archive',
  skip: 'fa-forward',
  default: 'fa-info-circle',
};

export function stripHtmlAndTruncate(html, maxLen = 120) {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

export const SKIP_REASONS = [
  { id: 'not_relevant', label: 'Not relevant', icon: 'fa-ban' },
  { id: 'wrong_location', label: 'Wrong location', icon: 'fa-map-marker-alt' },
  { id: 'low_salary', label: 'Low salary', icon: 'fa-dollar-sign' },
  { id: 'not_enough_info', label: 'Not enough info', icon: 'fa-question-circle' },
  { id: 'other', label: 'Other', icon: 'fa-ellipsis-h' },
];
