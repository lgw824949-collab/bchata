import React from 'react';

/**
 * 앱 전역 고정 헤더 높이: --app-header-height (56px) + safe-area-inset-top
 */
export default function AppPageHeader({
  variant = 'dark',
  sticky = true,
  className = '',
  innerClassName = '',
  left = null,
  center = null,
  right = null,
  children = null,
}) {
  return (
    <header
      className={[
        'app-page-header',
        variant === 'light' ? 'app-page-header--light' : 'app-page-header--dark',
        sticky ? 'app-page-header--sticky' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className={['app-page-header__inner', innerClassName].filter(Boolean).join(' ')}>
        {left ? <div className="app-page-header__slot app-page-header__slot--left">{left}</div> : null}
        {center ? <div className="app-page-header__slot app-page-header__slot--center">{center}</div> : null}
        {right ? <div className="app-page-header__slot app-page-header__slot--right">{right}</div> : null}
        {children}
      </div>
    </header>
  );
}
