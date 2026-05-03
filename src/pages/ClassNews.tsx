import React from 'react';
import { ChevronLeft } from 'lucide-react';

const ClassNewsPage = ({ selectedMonth, setSelectedMonth }) => {
  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', minHeight: '100vh', paddingBottom: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '950', color: '#0f172a' }}>클래스 소식 (준비 중)</h1>
        <p style={{ color: '#94A3B8', marginTop: '10px' }}>새로운 클래스 리스트를 구성해 주세요.</p>
      </div>
    </div>
  );
};

export default ClassNewsPage;
