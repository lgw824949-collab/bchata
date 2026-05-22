import { readFileSync, writeFileSync } from 'fs';
const p = 'c:/dev/bchata/src/pages/Home.tsx';
let t = readFileSync(p, 'utf8');

t = t.replace(
  `                <span className="home-poster-label" style={{ color: '#fff' }}>{item.label}</span>
              </motion.div>
            </motion.div>
          </motion.div>`,
  `                <span className="home-poster-label" style={{ color: '#fff' }}>{item.label}</span>
              </motion.div>
            </motion.div>
          </motion.div>`,
);

t = t.replace(
  `            ))}
          </motion.div>
        )}
      </motion.div>

      {activeTab === null && (
        <motion.div style={{ padding: '0 16px' }}>`,
  `            ))}
          </motion.div>
        )}
      </motion.div>

      {activeTab === null && (
        <motion.div style={{ padding: '0 16px' }}>`,
);

t = t.replace(
  `          {renderHeroPosters()}
        </motion.div>
      )}`,
  `          {renderHeroPosters()}
        </motion.div>
      )}`,
);

// Simplify Social BAR carousel block
const barOld = `                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={selectedRegionTab}
                    style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                  >
                    <motion.div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        padding: '2px 0 4px',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch',
                      }}
                    >
                      {previewBars.map((bar) => renderBarCard(bar, { carousel: true }))}`;

const barNew = `                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={selectedRegionTab}
                  >
                    <div className="home-social-bar-row">
                      {sortBarsByRichness(filteredBars).map((bar) => renderBarCard(bar))}`;

if (t.includes(barOld)) {
  t = t.replace(barOld, barNew);
  // Remove expand toggle and grid - find from showExpandToggle to closing of inner motion.div
  t = t.replace(
    /\{showExpandToggle &&[\s\S]*?\{barListExpanded &&[\s\S]*?\)\}\s*\n\s*<\/motion\.motion.div>\s*\n\s*\);\s*\n\s*\}\)\(\)/,
    `</div>
                  </motion.div>
                );
              })()`,
  );
}

writeFileSync(p, t);
console.log('fixed');
