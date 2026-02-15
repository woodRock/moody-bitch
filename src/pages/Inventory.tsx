import React, { useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { useTrackpadSwipe } from '../hooks/useTrackpadSwipe';
import type { InventoryItem } from '../context/GameContext';
import '../styles/Skyrim.css';

const CATEGORIES = ['ALL', 'APPAREL', 'POTIONS', 'BOOKS', 'MISC'];

const Inventory: React.FC = () => {
  const { stats, useItem, setUI } = useGame();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const filteredItems = selectedCategory === 'ALL' 
    ? stats.inventory 
    : stats.inventory.filter(item => item.category === selectedCategory);

  const handleSwipe = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    const currentIndex = CATEGORIES.indexOf(selectedCategory);
    if (direction === 'DOWN') {
      const nextIndex = Math.min(currentIndex + 1, CATEGORIES.length - 1);
      setSelectedCategory(CATEGORIES[nextIndex]);
      setSelectedItem(null);
    } else if (direction === 'UP') {
      const prevIndex = Math.max(currentIndex - 1, 0);
      setSelectedCategory(CATEGORIES[prevIndex]);
      setSelectedItem(null);
    }
  }, [selectedCategory]);

  useTrackpadSwipe({ onSwipe: handleSwipe, threshold: 80 });

  const handleUseItem = () => {
    if (selectedItem) {
      useItem(selectedItem);
      setSelectedItem(null);
    }
  };

  return (
    <div className="skills-container" style={{ background: 'radial-gradient(circle at center, #140a05 0%, #000 100%)' }}>
      <div className="star-field"></div>

      {/* BACK TO MENU ARROW (LEFT) */}
      <button 
        onClick={() => setUI({ isMenuOpen: true })}
        className="skyrim-font"
        style={{
          position: 'fixed',
          top: '2rem',
          left: '4rem',
          background: 'none',
          border: 'none',
          color: 'var(--skyrim-gold-bright)',
          fontSize: '3rem',
          cursor: 'pointer',
          zIndex: 100,
          opacity: 0.6
        }}
      >
        &larr;
      </button>
      
      <div style={{ marginTop: '100px', height: 'calc(100vh - 250px)', width: '90vw', margin: '100px auto' }}>
        <div className="inventory-menu-layout">
          <div className="magic-school-column" style={{ borderLeft: 'none', borderRight: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
            {CATEGORIES.map(cat => (
              <div key={cat} className={`magic-list-item ${selectedCategory === cat ? 'active' : ''}`} onClick={() => { setSelectedCategory(cat); setSelectedItem(null); }}>
                {cat}
              </div>
            ))}
          </div>

          <div className="magic-spell-column" style={{ borderLeft: 'none', borderRight: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
            <div>
              <div className="quest-category-title" style={{ padding: '1rem', textAlign: 'left' }}>Inventory</div>
              <div style={{ overflowY: 'auto', maxHeight: '60vh' }}>
                {filteredItems.map((item, idx) => (
                  <div key={item.uid || idx} className={`magic-list-item ${selectedItem?.uid === item.uid ? 'active' : ''}`} onClick={() => setSelectedItem(item)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.icon} {item.name}</span>
                    <span style={{ fontSize: '0.7rem', color: '#555' }}>{item.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="magic-details-column" style={{ paddingLeft: '2rem' }}>
            {selectedItem && (
              <div>
                <div style={{ fontSize: '5rem', marginBottom: '1rem', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))' }}>{selectedItem.icon}</div>
                <h1 className="skyrim-font" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{selectedItem.name}</h1>
                <div className="skyrim-font" style={{ color: 'var(--skyrim-gold-dim)', marginBottom: '1.5rem' }}>{selectedItem.category}</div>
                <div className="menu-separator" style={{ width: '100%', marginBottom: '2rem', opacity: 0.3 }}></div>
                <p className="quest-description" style={{ color: '#fff' }}>{selectedItem.description}</p>
                <div style={{ display: 'flex', gap: '3rem', marginTop: '2rem' }} className="skyrim-font">
                  <div>VALUE <span style={{ color: '#fff' }}>{selectedItem.value}</span></div>
                  <div>WEIGHT <span style={{ color: '#fff' }}>{selectedItem.weight}</span></div>
                </div>
                <div style={{ marginTop: '4rem' }}>
                  <button className="btn" onClick={handleUseItem} disabled={selectedItem.category === 'APPAREL'} style={{ background: selectedItem.category === 'APPAREL' ? 'rgba(255,255,255,0.1)' : 'var(--skyrim-blue)', border: '1px solid #4a90e2', color: '#fff', padding: '0.8rem 2rem' }}>
                    {selectedItem.category === 'POTIONS' || selectedItem.category === 'MISC' ? 'USE ITEM' : 'EQUIP ITEM'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
