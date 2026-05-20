import React from 'react';
import InstructorSection from '../components/InstructorSection';

const Instructors = ({ onOpenVipMaster, cachedInstructors = null }) => {
  return (
    <div style={{ paddingBottom: '100px' }}>
      <InstructorSection onOpenVipMaster={onOpenVipMaster} cachedInstructors={cachedInstructors} />
    </div>
  );
};

export default Instructors;
