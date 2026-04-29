export default async function handler(req, res) {
  const { lat, lon } = req.query;
  const apiKey = process.env.RESTAURANT_API_KEY;
  
  if (!apiKey) return res.status(500).json({ error: "API key missing" });
  
  try {
    // 소상공인 상가정보 API (반경 조회)
    // cx: 경도(lon), cy: 위도(lat), indsLclsCd: I2 (음식 카테고리)
    const url = `https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius?serviceKey=${apiKey}&radius=1000&cx=${lon}&cy=${lat}&type=json&indsLclsCd=I2`;
    
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch(e) {
    console.error("Restaurant Proxy Error:", e);
    res.status(500).json({ error: e.message });
  }
}
