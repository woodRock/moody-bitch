import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import type { InventoryItem } from '../game/types';

export const CATEGORIES = ['ALL', 'APPAREL', 'POTIONS', 'BOOKS', 'MISC'] as const;

const Inventory: React.FC = () => {
  const { stats, consumeItem, setUI, toggleEquip } = useGame();
  const { playSound } = useSound();
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('ALL');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const filteredItems = selectedCategory === 'ALL' ? stats.inventory : stats.inventory.filter(i => i.category === selectedCategory);
  const totalWeight = stats.inventory.reduce((w, i) => w + i.weight, 0);

  const handleUseItem = async () => {
    if (!selectedItem) return;
    if (selectedItem.category === 'APPAREL') await toggleEquip(selectedItem.uid);
    else { await consumeItem(selectedItem); setSelectedItem(null); }
  };

  const isEquipped = !!selectedItem && stats.equippedItemId === selectedItem.uid;

  return (
    <div className="skills-container inventory-screen">
      <div className="star-field" />
      <button onClick={() => { setUI({ isMenuOpen: true }); playSound('UI_CLICK'); }} className="nav-arrow left-top" aria-label="Open character menu">&larr;</button>

      <div className="three-column-frame">
        <div className="inventory-menu-layout">
          <div className="magic-school-column ltr">
            {CATEGORIES.map(cat => (
              <div key={cat} className={`magic-list-item ltr ${selectedCategory === cat ? 'active' : ''}`} onClick={() => { setSelectedCategory(cat); setSelectedItem(null); playSound('UI_CLICK'); }}>
                {cat}
              </div>
            ))}
            <div className="skyrim-font carry-weight">CARRY WEIGHT <span>{totalWeight.toFixed(1)}</span></div>
          </div>

          <div className="magic-spell-column ltr">
            <div className="quest-category-title" style={{ padding: '1rem' }}>Inventory</div>
            <div className="scroll-list">
              {filteredItems.length === 0 && <p className="skyrim-serif muted" style={{ padding: '0 1rem' }}>Nothing here. Every 5th quest completed drops loot.</p>}
              {filteredItems.map(item => {
                const equipped = stats.equippedItemId === item.uid;
                return (
                  <div key={item.uid} className={`magic-list-item ltr row ${selectedItem?.uid === item.uid ? 'active' : ''}`} onClick={() => { setSelectedItem(item); playSound('UI_CLICK'); }}>
                    <span style={{ color: equipped ? 'var(--skyrim-gold-bright)' : 'inherit' }}>{item.icon} {item.name} {equipped && '(EQUIPPED)'}</span>
                    <span className="item-weight">{item.weight}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="magic-details-column" style={{ paddingLeft: '2rem' }}>
            {selectedItem ? (
              <div>
                <div className="item-hero">{selectedItem.icon}</div>
                <h1 className="skyrim-font detail-title">{selectedItem.name}</h1>
                <div className="skyrim-font" style={{ color: 'var(--skyrim-gold-dim)', marginBottom: '1.5rem' }}>{selectedItem.category}</div>
                <div className="menu-separator wide" />
                <p className="quest-description" style={{ color: '#fff' }}>{selectedItem.description}</p>
                <div className="item-stats skyrim-font">
                  <div>VALUE <span>{selectedItem.value}</span></div>
                  <div>WEIGHT <span>{selectedItem.weight}</span></div>
                </div>
                <div style={{ marginTop: '3rem' }}>
                  <button className={`btn-primary skyrim-font ${isEquipped ? 'danger' : 'blue'}`} onClick={() => void handleUseItem()}>
                    {selectedItem.category === 'APPAREL' ? (isEquipped ? 'UNEQUIP' : 'EQUIP ITEM') : selectedItem.category === 'BOOKS' ? 'READ' : 'USE ITEM'}
                  </button>
                </div>
              </div>
            ) : <p className="skyrim-serif muted" style={{ marginTop: '4rem', textAlign: 'center' }}>Select an item.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
