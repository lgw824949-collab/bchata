import React from 'react';
import { ChevronLeft } from 'lucide-react';

type TermsProps = {
  onBack?: () => void;
};

const sectionStyle: React.CSSProperties = { marginBottom: 28 };
const h2Style: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: '#1E293B',
  marginBottom: 10,
};
const pStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.75,
  color: '#475569',
  margin: '0 0 10px',
};
const ulStyle: React.CSSProperties = {
  margin: '0 0 10px',
  paddingLeft: 20,
  fontSize: 14,
  lineHeight: 1.75,
  color: '#475569',
};

export default function Terms({ onBack }: TermsProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          background: '#fff',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <button
          type="button"
          onClick={() => (onBack ? onBack() : window.history.back())}
          aria-label="뒤로"
          style={{
            border: 'none',
            background: '#F1F5F9',
            borderRadius: 12,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={22} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 900, color: '#1E293B', margin: 0 }}>이용약관</h1>
      </header>

      <article style={{ flex: 1, padding: '20px 16px 48px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <p style={{ ...pStyle, fontSize: 13, color: '#64748B' }}>
          시행일: 2026년 5월 20일 · 서비스명: <strong>오늘밤빠</strong>
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>제1조 (목적)</h2>
          <p style={pStyle}>
            본 약관은 <strong>오늘밤빠</strong>(이하 &quot;회사&quot;)가 제공하는 댄스 파티·소셜·행사 정보
            모바일 웹/앱 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간 권리·의무 및
            책임사항을 정함을 목적으로 합니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>제2조 (정의)</h2>
          <ul style={ulStyle}>
            <li>&quot;이용자&quot;란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
            <li>&quot;회원&quot;이란 서비스에 가입하여 계정을 부여받은 자를 말합니다.</li>
            <li>
              &quot;콘텐츠&quot;란 서비스 내 게시된 파티·바·강사·행사 정보, 이미지, 텍스트, 링크 등 일체를
              말합니다.
            </li>
            <li>
              &quot;제휴·외부 링크&quot;란 카카오톡, 인스타그램, 결제·예약 등 서비스 밖으로 연결되는
              페이지를 말합니다.
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>제3조 (약관의 게시와 변경)</h2>
          <p style={pStyle}>
            회사는 본 약관의 내용을 서비스 초기 화면 또는 연결 화면에 게시합니다. 관련 법령을 위반하지
            않는 범위에서 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경 사유를 사전에 공지합니다.
            이용자가 변경 약관 시행일 이후에도 서비스를 계속 이용하는 경우 변경 약관에 동의한 것으로
            봅니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>제4조 (서비스의 제공)</h2>
          <p style={pStyle}>회사는 다음과 같은 서비스를 제공합니다.</p>
          <ul style={ulStyle}>
            <li>댄스 파티·소셜·부트캠프·페스티벌 등 행사 정보 열람 및 검색</li>
            <li>지역·장르·날짜 기반 행사 추천 및 바(venue) 정보 제공</li>
            <li>행사 등록·문의·커뮤니티 등 부가 기능(제공 시)</li>
            <li>위치 정보를 활용한 거리·지역 기반 정보 표시(이용자 동의 시)</li>
          </ul>
          <p style={pStyle}>
            서비스는 연중무휴를 원칙으로 하나, 시스템 점검·장애·천재지변 등으로 일시 중단될 수
            있습니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>제5조 (이용자의 의무)</h2>
          <p style={pStyle}>이용자는 다음 행위를 하여서는 안 됩니다.</p>
          <ul style={ulStyle}>
            <li>타인의 정보 도용, 허위 정보 등록, 스팸·광고성 게시</li>
            <li>음란·혐오·차별·폭력 조장, 타인 명예 훼손 및 개인정보 무단 수집·유출</li>
            <li>서비스·서버·네트워크에 대한 비정상적 접근, 해킹, 역설계, 자동 수집(크롤링) 등</li>
            <li>회사 또는 제3자의 지식재산권·영업비밀 침해</li>
            <li>관계 법령 및 공서양속에 반하는 행위</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>제6조 (게시물 및 이용자 콘텐츠)</h2>
          <p style={pStyle}>
            이용자가 등록한 게시물에 대한 책임은 이용자에게 있으며, 회사는 합리적 사유가 있는 경우
            사전 통지 없이 게시물을 삭제·숨김 처리할 수 있습니다. 이용자는 자신이 게시한 콘텐츠에
            필요한 권리(저작권·초상권 등)를 보유하거나 적법한 이용 허락을 받아야 합니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>제7조 (위치기반서비스)</h2>
          <p style={pStyle}>
            서비스는 이용자의 동의 하에 위치정보를 수집·이용하여 주변 행사·바 정보를 제공할 수
            있습니다. 위치정보 이용에 관한 상세 내용은 「개인정보처리방침」을 따릅니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>제8조 (저작권)</h2>
          <p style={pStyle}>
            서비스에 게시된 회사 또는 제휴사의 로고·디자인·소프트웨어·데이터베이스 등에 대한 저작권 및
            지식재산권은 회사 또는 정당한 권리자에게 귀속됩니다. 이용자는 회사의 사전 서면 동의 없이
            이를 복제·배포·2차적 저작물 작성에 이용할 수 없습니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>제9조 (면책)</h2>
          <p style={pStyle}>
            회사는 이용자가 서비스에 게재된 행사·바·강사 정보를 신뢰하여 참석·결제·예약 등을 한 결과에
            대해 책임지지 않습니다. 천재지변·통신 장애·제3자 서비스(카카오·SNS·결제 등) 오류로 인한
            손해에 대해 회사는 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다. 무료로 제공되는
            서비스에 대해서는 관련 법령이 허용하는 범위 내에서 책임이 제한될 수 있습니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>제10조 (손해배상)</h2>
          <p style={pStyle}>
            이용자가 본 약관을 위반하여 회사에 손해가 발생한 경우, 해당 이용자는 회사가 입은 손해를
            배상하여야 합니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>제11조 (분쟁 해결 및 관할)</h2>
          <p style={pStyle}>
            서비스 이용과 관련하여 분쟁이 발생한 경우 회사와 이용자는 성실히 협의합니다. 협의가
            이루어지지 않을 때는 대한민국 법령을 준거법으로 하며, 관할 법원은 민사소송법 등 관련
            법령에 따릅니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>부칙</h2>
          <p style={pStyle}>본 약관은 2026년 5월 20일부터 시행합니다.</p>
          <p style={pStyle}>
            문의:{' '}
            <a href="mailto:lgw261225@gmail.com" style={{ color: '#7C3AED', fontWeight: 700 }}>
              lgw261225@gmail.com
            </a>
          </p>
        </section>
      </article>
    </div>
  );
}
