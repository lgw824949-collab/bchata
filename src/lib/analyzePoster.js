const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const analyzePoster = async (imageUrl) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API Key가 설정되지 않았습니다.');
  }

  const prompt = `이 댄스 이벤트 포스터 이미지를 분석해서 아래 정보를 JSON으로 추출해줘.
찾을 수 없는 항목은 빈 문자열("")로 반환해.

반드시 아래 JSON 형식으로만 응답해 (다른 텍스트 없이):
{
  "title": "이벤트 제목",
  "instructor": "강사 이름 (부트캠프용)",
  "organizer": "주최자/단체명 (페스티벌용)",
  "genre": "장르 (바차타/살사/키좀바/쥬크 중 하나)",
  "start_date": "YYYY-MM-DD 형식",
  "end_date": "YYYY-MM-DD 형식",
  "venue": "상세 장소/주소",
  "region": "지역 (서울/수도권/강원/제주/부산경남/전라/충청 중 하나)",
  "price_info": "가격 정보",
  "description": "상세 설명 (있으면)",
  "level": "레벨 (초급/중급/상급/전체 중 하나, 없으면 전체)"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'OpenAI API 오류');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('포스터 분석 결과를 읽지 못했습니다.');
  }
};
