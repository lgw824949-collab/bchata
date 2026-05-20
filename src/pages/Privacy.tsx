import React from 'react';
import { ChevronLeft } from 'lucide-react';

type PrivacyProps = {
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

const CONTACT_EMAIL = 'lgw261225@gmail.com';

export default function Privacy({ onBack }: PrivacyProps) {
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
        <h1 style={{ fontSize: 18, fontWeight: 900, color: '#1E293B', margin: 0 }}>개인정보처리방침</h1>
      </header>

      <article style={{ flex: 1, padding: '20px 16px 48px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <p style={{ ...pStyle, fontSize: 13, color: '#64748B' }}>
          시행일: 2026년 5월 20일 · 서비스명: <strong>오늘밤빠</strong>
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. 개인정보처리자</h2>
          <p style={pStyle}>
            <strong>오늘밤빠</strong> 서비스 운영자(이하 &quot;회사&quot;)는 「개인정보 보호법」 등 관련
            법령에 따라 이용자의 개인정보를 보호하며, 본 방침을 통해 수집·이용·보관·파기 절차를
            안내합니다.
          </p>
          <p style={pStyle}>
            개인정보 보호 책임자 및 문의:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#7C3AED', fontWeight: 700 }}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. 수집하는 개인정보 항목</h2>
          <p style={pStyle}>회사는 서비스 제공을 위해 다음 정보를 수집할 수 있습니다.</p>
          <ul style={ulStyle}>
            <li>
              <strong>이메일</strong>: 회원 가입·문의·행사 등록·알림(선택) 시
            </li>
            <li>
              <strong>위치정보</strong>: GPS·IP 기반 좌표(이용자 기기 설정 및 동의 시) — 주변 바·파티
              거리 표시, 지역 기반 추천
            </li>
            <li>
              <strong>기기정보</strong>: OS·브라우저 종류, 화면 해상도, 앱/웹 버전, 접속 로그, 쿠키·로컬
              저장소 식별자
            </li>
            <li>서비스 이용 기록: 조회·찜·클릭·검색·등록 행사 정보(해당 기능 이용 시)</li>
          </ul>
          <p style={pStyle}>
            필수 항목 미제공 시 일부 기능(위치 기반 추천, 등록·알림 등) 이용이 제한될 수 있습니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. 수집·이용 목적</h2>
          <ul style={ulStyle}>
            <li>회원 식별, 본인 확인, 계정 관리</li>
            <li>댄스 파티·행사 정보 제공, 맞춤 검색·추천</li>
            <li>
              <strong>위치기반 파티·바 추천</strong> 및 거리순 정렬(사주·추천·지도 등 기능 포함)
            </li>
            <li>서비스 개선, 오류 분석, 이용 통계(비식별·집계 처리 가능)</li>
            <li>부정 이용 방지, 분쟁 대응, 법령상 의무 이행</li>
            <li>공지·고객 문의 응대(이메일 회신)</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. 보유 및 이용 기간</h2>
          <ul style={ulStyle}>
            <li>회원 정보: 회원 탈퇴 시까지(탈퇴 후 지체 없이 파기, 법령 보존 예외 적용)</li>
            <li>위치정보: 수집 목적 달성 시 또는 동의 철회·서비스 종료 시 지체 없이 파기</li>
            <li>접속·이용 로그: 통상 3개월~1년(내부 정책·법령에 따름)</li>
            <li>
              관계 법령에 따라 보관이 필요한 경우(전자상거래, 분쟁 대응 등) 해당 기간 동안 별도
              보관
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. 제3자 제공</h2>
          <p style={pStyle}>
            회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 아래의 경우 예외로
            합니다.
          </p>
          <ul style={ulStyle}>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령에 따른 수사·조사 기관의 적법한 요청</li>
            <li>
              서비스 운영에 필요한 <strong>수탁 처리</strong>(예: 클라우드 DB·호스팅 — Supabase,
              Vercel 등). 수탁사는 계약을 통해 개인정보 보호 의무를 준수합니다.
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. 개인정보의 파기 절차 및 방법</h2>
          <p style={pStyle}>
            보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다.
          </p>
          <ul style={ulStyle}>
            <li>전자적 파일: 복구 불가능한 방법으로 영구 삭제</li>
            <li>출력물: 분쇄 또는 소각</li>
            <li>위치·캐시 데이터: 앱/브라우저 저장소 삭제 및 서버 레코드 삭제</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. 이용자의 권리</h2>
          <p style={pStyle}>
            이용자는 언제든지 자신의 개인정보에 대해 열람·정정·삭제·처리 정지·동의 철회를 요청할 수
            있습니다. 위치정보는 기기 설정에서 권한을 철회할 수 있으며, 철회 시 위치 기반 기능이
            제한됩니다. 요청은 아래 이메일로 접수하며, 회사는 관련 법령에 따라 지체 없이 조치합니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. 위치정보 관리</h2>
          <p style={pStyle}>
            위치정보는 「위치정보의 보호 및 이용 등에 관한 법률」에 따라 이용자 동의 후 수집·이용됩니다.
            회사는 위치정보를 제3자에게 판매하지 않으며, 서비스 제공·통계 목적 외로 사용하지
            않습니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. 쿠키 및 유사 기술</h2>
          <p style={pStyle}>
            서비스는 로그인 유지·언어 설정·이용 분석을 위해 쿠키·로컬 스토리지를 사용할 수 있습니다.
            브라우저 설정에서 거부할 수 있으나, 일부 기능이 제한될 수 있습니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>10. 개인정보의 안전성 확보</h2>
          <p style={pStyle}>
            회사는 접근 권한 관리, 전송 구간 암호화(HTTPS), 비밀번호·키 보관 등 합리적 보안 조치를
            시행합니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>11. 아동의 개인정보</h2>
          <p style={pStyle}>
            서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 해당 연령 미만의 개인정보를 고의로
            수집하지 않습니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>12. 방침의 변경</h2>
          <p style={pStyle}>
            법령·서비스 변경 시 본 방침을 개정하며, 중요한 변경은 서비스 내 공지합니다. 변경
            방침은 공지한 시행일부터 적용됩니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>13. 문의처</h2>
          <p style={pStyle}>
            개인정보 관련 문의·불만·피해 구제:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#7C3AED', fontWeight: 700 }}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p style={pStyle}>
            개인정보침해 신고: 개인정보침해신고센터(privacy.kisa.or.kr), 대검찰청 사이버수사과,
            경찰청 사이버수사국 등 관계 기관을 이용할 수 있습니다.
          </p>
        </section>
      </article>
    </div>
  );
}
