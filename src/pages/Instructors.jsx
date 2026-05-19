import React from 'react';
import InstructorSection from '../components/InstructorSection';

const Instructors = ({ onOpenVipMaster }) => {
  return (
    <div style={{ paddingBottom: '100px' }}>
      <InstructorSection onOpenVipMaster={onOpenVipMaster} />
    </div>
  );
};

export default Instructors;
