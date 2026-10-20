import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import Modal from '../components/Skyrim/Modal';
import type { InventoryItem } from '../game/types';

const CATEGORIES = ['ALL', 'APPAREL', 'POTIONS', 'BOOKS', 'MISC'] as const;

const MobileItems: React.FC = () => {
  const { stats, consumeItem, toggleEquip } = useGame();
  const { playSound } = useSound();
  const [cat, setCat] = useState<typeof CATEGORIES[number]>('ALL');
  const [open, setOpen] = useState<InventoryItem | null>(null);

  const items = cat === 'ALL' ? stats.inventory : stats.inventory.filter(i => i.category === cat);
  const equipped = open ? stats.equippedItemId === open.uid : false;

  const use = async () => {
    if (!open) return;
    const item = open;
    setOpen(null);
    if (item.category === 'APPAREL') await toggleEquip(item.uid);
    else await consumeItem(item);
  };

  return (
    <div className="m-page">
      <div className="m-page-head">
        <h1 className="skyrim-font">ITEMS</h1>
        <span className="skyrim-serif muted">{stats.inventory.length} carried</span>
      </div>

      <div className="m-chips">
        {CATEGORIES.map(c => <button key={c} className={`m-chip skyrim-font ${cat === c ? 'active' : ''}`} onClick={() => { setCat(c); playSound('UI_CLICK'); }}>{c}</button>)}
      </div>

      {items.length === 0 && <div className="m-empty skyrim-serif">Nothing here. Every 5th completed quest drops loot.</div>}
      {items.map(item => (
        <button key={item.uid} className="m-item" onClick={() => { setOpen(item); playSound('UI_CLICK'); }}>
          <span className="m-item-icon">{item.icon}</span>
          <span className="m-item-text">
            <span className={`skyrim-font ${stats.equippedItemId === item.uid ? 'gold' : ''}`}>{item.name}{stats.equippedItemId === item.uid ? ' · EQUIPPED' : ''}</span>
            <span className="skyrim-serif muted small">{item.description}</span>
          </span>
        </button>
      ))}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.name} className="sheet">
        {open && (
          <>
            <div className="item-hero" style={{ textAlign: 'center' }}>{open.icon}</div>
            <div className="skyrim-font" style={{ color: 'var(--skyrim-gold-dim)', textAlign: 'center', marginBottom: '1rem' }}>{open.category}</div>
            <p className="quest-description">{open.description}</p>
            <div className="item-stats skyrim-font"><div>VALUE <span>{open.value}</span></div><div>WEIGHT <span>{open.weight}</span></div></div>
            <div className="form-actions">
              <button className={`btn-primary skyrim-font ${equipped ? 'danger' : 'blue'}`} onClick={() => void use()}>
                {open.category === 'APPAREL' ? (equipped ? 'UNEQUIP' : 'EQUIP') : open.category === 'BOOKS' ? 'READ' : 'USE'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default MobileItems;
