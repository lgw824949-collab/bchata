export const formatBarDistrictLabel = (bar: { address?: string; region?: string }) => {
  const addr = String(bar?.address || '').trim();
  if (addr) {
    const districtMatch = addr.match(/([가-힣]+(?:구|동))/);
    if (districtMatch) return districtMatch[1];
    const parts = addr.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return parts[1];
    if (parts.length) return parts[0];
  }
  return bar?.region || '';
};

export const formatInstructorGenre = (genre: unknown) => {
  if (Array.isArray(genre)) return genre.filter(Boolean).join(' · ');
  return String(genre || '').trim();
};

export const englishDaySocialPartyLabel = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${days[new Date().getDay()]} Social Party`;
};
