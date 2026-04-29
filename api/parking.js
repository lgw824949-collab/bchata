export default async function handler(req, res) {
  const { lat, lon } = req.query;
  const apiKey = process.env.PARKING_API_KEY;
  
  console.log("apiKey:", apiKey);
  console.log("lat:", lat, "lon:", lon);
  
  if (!apiKey) {
    return res.status(500).json({ error: "API key missing" });
  }
  
  // 공공데이터 API URL 구성
  const url = `https://apis.data.go.kr/1741000/ResrceOpenShareService/getResrceLctnList?serviceKey=${apiKey}&pageNo=1&numOfRows=20&type=json&resrceCtgryId=010800&lctnLattitud=${lat}&lctnLongitud=${lon}&radius=2`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // 응답 반환
    res.status(200).json(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
}
