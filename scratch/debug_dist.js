
const BAR_DATABASE = [
  { name: '보니따', lat: 37.5560, lon: 126.9218 },
  { name: '홍턴', lat: 37.5563, lon: 126.9221 },
  { name: '부에나2차', lat: 37.5566, lon: 126.9228 },
  { name: '까리베 2차', lat: 37.5578, lon: 126.9185 },
  { name: '마콘도', lat: 37.5558, lon: 126.9225 },
  { name: '팰리스클럽', lat: 37.5572, lon: 126.9178 },
  { name: '안단테', lat: 37.5548, lon: 126.9198 },
  { name: '놀이터 2차', lat: 37.5564, lon: 126.9224 },
  { name: '하바나', lat: 37.5545, lon: 126.9212 },
  { name: '아난타라', lat: 37.5552, lon: 126.9202 },
  { name: '솔SOL빠2차', lat: 37.5556, lon: 126.9228 },
  { name: '꼼애야 2차', lat: 37.5562, lon: 126.9222 },
];

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
};

// 사용자가 홍턴 근처(예: 홍대역 1번출구 37.5560, 126.9220)에 있다고 가정
const userLat = 37.5560;
const userLon = 126.9220;

const venues = BAR_DATABASE
  .map(b => ({
    name: b.name,
    dist: calculateDistance(userLat, userLon, b.lat, b.lon)
  }))
  .sort((a, b) => a.dist - b.dist)
  .slice(0, 10);

console.log(venues);
