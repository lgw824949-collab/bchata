export default async function handler(req, res) {
  const { lat, lon } = req.query;
  const apiKey = process.env.VITE_PARKING_API_KEY || process.env.PARKING_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: "API key missing" });
  }
  
  const decodedKey = decodeURIComponent(apiKey);
  const url = `https://apis.data.go.kr/1741000/ResrceOpenShareService/getResrceLctnList?serviceKey=${encodeURIComponent(decodedKey)}&pageNo=1&numOfRows=20&type=json&resrceCtgryId=010800&lctnLattitud=${lat}&lctnLongitud=${lon}&radius=2`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ 
      error: "Proxy Error", 
      details: error.message,
      keyFound: !!apiKey
    });
  }
}
