import React from 'react';
import { ChevronLeft } from 'lucide-react';

const Parking = ({ onBack }) => {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #eee',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button 
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            padding: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          <ChevronLeft size={24} color="#1E293B" />
        </button>
        <h1 style={{
          fontSize: '18px',
          fontWeight: 900,
          color: '#1E293B',
          margin: 0
        }}>🅿️ 주차장 정보</h1>
      </div>

      {/* 내용 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔜</div>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 900,
          color: '#1E293B',
          marginBottom: '10px'
        }}>주차장 정보를 준비 중이에요!</h2>
        <p style={{
          fontSize: '14px',
          color: '#64748B',
          lineHeight: '1.6'
        }}>
          주변 공유 주차장 실시간 정보를<br />
          곧 만나보실 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default Parking;
