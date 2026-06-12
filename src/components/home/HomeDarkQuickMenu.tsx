import React from 'react';
import { motion } from 'framer-motion';
import type { HomeDarkQuickMenuItem } from './types';

type HomeDarkQuickMenuProps = {
  isEn: boolean;
  items: HomeDarkQuickMenuItem[];
};

export default function HomeDarkQuickMenu({ isEn, items }: HomeDarkQuickMenuProps) {
  return (
    <nav className="home-dark-quick-menu" aria-label={isEn ? 'Quick menu' : '퀵메뉴'}>
      {items.map((item) => (
        <motion.button
          key={item.id}
          type="button"
          className="home-dark-quick-menu__btn"
          whileTap={{ scale: 0.96 }}
          onClick={item.onClick}
          aria-label={isEn ? item.labelEn : item.labelKo}
        >
          <span className="home-dark-quick-menu__emoji" aria-hidden>
            {item.emoji}
          </span>
          <span className="home-dark-quick-menu__label">
            {isEn ? item.labelEn : item.labelKo}
          </span>
        </motion.button>
      ))}
    </nav>
  );
}
