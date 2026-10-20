import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { useSound } from '../../context/SoundContext';
import { useAuth } from '../../context/AuthContext';
import { useQuests } from '../../hooks/useQuests';
import { useMoodEntries } from '../../hooks/useMoodEntries';
import { clearLocationHistory } from '../../services/locationService';
import { purgeUserData } from '../../services/accountService';
import StandingStones from './StandingStones';
import { skillMeaning } from '../../game/skills';
import { periodSummary, XP } from '../../game/rules';
import { CONSTELLATIONS } from '../../data/constellations';
import { stoneById } from '../../game/stones';
import { describeAuthError } from '../../context/AuthContext';
import Modal from './Modal';
import LogForm from './LogForm';
import QuestForm from './QuestForm';
import type { Quest, MoodEntry } from '../../game/types';
import type { UIState } from '../../context/GameContext';

const StatsChart = lazy(() => import('./StatsChart'));

type Tab = UIState['pauseTab'];
const TABS: Tab[] = ['QUESTS', 'STATS', 'JOURNAL', 'SYSTEM'];

interface PauseMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemSettings: React.FC = () => {
  const { stats, setTrackLocation, notify } = useGame();
  const { volume, muted, setVolume, setMuted, playSound } = useSound();
  const { currentUser, signOut, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const usesPassword = !!currentUser?.providerData.some(p => p.providerId === 'password');

  const deleteCharacter = async () => {
    if (!currentUser || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await purgeUserData(currentUser.uid);
      await deleteAccount(usesPassword ? deletePassword : undefined);
      navigate('/signin');
    } catch (err) {
      console.error('Delete failed', err);
      setDeleteError(describeAuthError(err));
    } finally {
      setDeleting(false);
    }
  };

  const clearJourney = async () => {
    if (!currentUser) return;
    setClearing(true);
    try {
      const n = await clearLocationHistory(currentUser.uid);
      notify('JOURNEY CLEARED', `${n} MARKERS REMOVED`);
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  };

  const logout = async () => {
    try { await signOut(); navigate('/signin'); } catch (e) { console.error('Failed to log out', e); }
  };

  return (
    <div className="system-settings">
      <section>
        <div className="quest-category-title">Sound</div>
        <label className="setting-row">
          <span className="skyrim-font">EFFECTS VOLUME</span>
          <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={e => { setMuted(false); setVolume(Number(e.target.value)); }} onMouseUp={() => playSound('UI_CLICK')} className="range-input" aria-label="Effects volume" />
        </label>
        <label className="setting-row">
          <span className="skyrim-font">MUTE</span>
          <input type="checkbox" checked={muted} onChange={e => setMuted(e.target.checked)} className="toggle" />
        </label>
      </section>

      <section>
        <div className="quest-category-title">Journey Map</div>
        <label className="setting-row">
          <span className="skyrim-font">RECORD MY LOCATION<small className="skyrim-serif muted">Marks where quests and logs happen. Only you can see it.</small></span>
          <input type="checkbox" checked={stats.trackLocation} onChange={e => void setTrackLocation(e.target.checked)} className="toggle" />
        </label>
        <div className="setting-row">
          <span className="skyrim-font">CLEAR JOURNEY<small className="skyrim-serif muted">Permanently removes every location marker.</small></span>
          {confirmClear ? (
            <span className="inline-actions">
              <button className="btn-ghost small danger skyrim-font" onClick={() => void clearJourney()} disabled={clearing}>{clearing ? '...' : 'CONFIRM'}</button>
              <button className="btn-ghost small skyrim-font" onClick={() => setConfirmClear(false)}>KEEP</button>
            </span>
          ) : <button className="btn-ghost small skyrim-font" onClick={() => setConfirmClear(true)}>CLEAR</button>}
        </div>
      </section>

      <section>
        <div className="quest-category-title">Account</div>
        <div className="setting-row">
          <span className="skyrim-serif muted account-email">{currentUser?.email}</span>
          <button className="btn-ghost small danger skyrim-font" onClick={() => void logout()}>QUIT REALM</button>
        </div>
        <div className="setting-row">
          <span className="skyrim-font">DELETE CHARACTER<small className="skyrim-serif muted">Erases your account, quests, chronicles and journey. There is no resurrection.</small></span>
          <button className="btn-ghost small danger skyrim-font" onClick={() => { setDeleteOpen(true); setDeleteError(''); setDeletePassword(''); }}>DELETE</button>
        </div>
      </section>

      <Modal open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} title="DELETE CHARACTER" width={520} className="sheet">
        <p className="skyrim-serif modal-lead">This removes <b>{stats.name}</b> and everything they ever did: every quest, chronicle and marker on the map, and the account itself. It cannot be undone.</p>
        {usesPassword && (
          <div className="input-group">
            <label className="skyrim-font field-label" htmlFor="del-pass"><span>CONFIRM YOUR PASSWORD</span></label>
            <input id="del-pass" type="password" autoComplete="current-password" className="parchment-input dark" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
          </div>
        )}
        {deleteError && <p className="form-error skyrim-serif" role="alert">{deleteError}</p>}
        <div className="form-actions">
          <button className="btn-primary danger skyrim-font" disabled={deleting || (usesPassword && !deletePassword)} onClick={() => void deleteCharacter()}>{deleting ? 'ERASING...' : 'ERASE EVERYTHING'}</button>
          <button className="btn-ghost skyrim-font" disabled={deleting} onClick={() => setDeleteOpen(false)}>KEEP MY CHARACTER</button>
        </div>
      </Modal>
    </div>
  );
};

const PauseMenu: React.FC<PauseMenuProps> = ({ isOpen, onClose }) => {
  const { stats, ui, setUI } = useGame();
  const { playSound } = useSound();
  const { quests, adding, addQuest, toggleQuest, deleteQuest } = useQuests();
  const { entries, streak, saving, addEntry, deleteEntry } = useMoodEntries();
  const activeTab = ui.pauseTab;
  const setActiveTab = useCallback((t: Tab) => setUI({ pauseTab: t }), [setUI]);

  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isAddQuestOpen, setIsAddQuestOpen] = useState(false);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  const selectedQuest: Quest | null = quests.find(q => q.id === selectedQuestId) ?? quests[0] ?? null;
  const selectedEntry: MoodEntry | null = entries.find(e => e.id === selectedEntryId) ?? entries[0] ?? null;

  useEffect(() => { setConfirmAbandon(false); }, [selectedQuestId]);

  if (!isOpen) return null;

  return (
    <>
      <div className="pause-menu-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="pause-menu-container" role="dialog" aria-modal="true" aria-label="System menu">
          <div className="pause-menu-tabs" role="tablist">
            {TABS.map(tab => (
              <button key={tab} role="tab" aria-selected={activeTab === tab} className={`pause-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => { setActiveTab(tab); playSound('UI_CLICK'); }}>
                {tab}
              </button>
            ))}
          </div>

          <div className="pause-content">
            {activeTab === 'QUESTS' && (
              <div className="quest-menu-layout">
                <div className="quest-list-column">
                  <div className="column-head">
                    <div className="quest-category-title" style={{ margin: 0 }}>Quest Log</div>
                    <button onClick={() => { setIsAddQuestOpen(true); playSound('UI_CLICK'); }} className="add-quest-btn-plus" aria-label="Add quest">+</button>
                  </div>
                  <div className="scroll-list">
                    {quests.length === 0 && <p className="skyrim-serif muted">No quests yet. Press + to accept your first.</p>}
                    {([['daily', 'Daily'], ['weekly', 'Bounties'], ['one-off', 'Side Quests']] as const).map(([type, heading]) => {
                      const group = quests.filter(q => q.type === type);
                      if (group.length === 0) return null;
                      const done = group.filter(q => q.completed).length;
                      return (
                        <div key={type} className="quest-group">
                          <div className="quest-group-head skyrim-font">{heading} <span>{done}/{group.length}</span></div>
                          {group.map(q => (
                            <div key={q.id} className={`quest-list-item ${selectedQuest?.id === q.id ? 'active' : ''}`} onClick={() => { setSelectedQuestId(q.id); playSound('UI_CLICK'); }}>
                              <div className={`quest-diamond ${q.completed ? 'filled' : ''}`} />
                              <div className="quest-list-text">
                                <span className="skyrim-font" style={{ opacity: q.completed ? 0.5 : 1 }}>{q.title}</span>
                                <span className="skyrim-serif quest-meta">{q.skill} <span className="meaning">· {skillMeaning(q.skill)}</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="quest-details-column">
                  {selectedQuest ? (
                    <>
                      <h1 className="skyrim-font detail-title">{selectedQuest.title.toUpperCase()}</h1>
                      <div className="menu-separator wide" />
                      <p className="quest-description">{selectedQuest.description}</p>
                      <div className="quest-category-title" style={{ marginTop: '2rem' }}>Objectives</div>
                      <button className="objective-item" onClick={() => void toggleQuest(selectedQuest)}>
                        <div className={`objective-marker ${selectedQuest.completed ? 'completed' : ''}`} />
                        <span className="skyrim-serif" style={{ color: selectedQuest.completed ? '#777' : '#fff' }}>
                          {selectedQuest.completed ? (selectedQuest.type === 'one-off' ? 'Completed. ' : selectedQuest.type === 'daily' ? 'Done today. ' : 'Done this week. ') : ''}
                          Invest in the {selectedQuest.skill} skill <span className="meaning">({skillMeaning(selectedQuest.skill)})</span> by completing this task.
                        </span>
                      </button>
                      <div className="quest-reward skyrim-font">
                        REWARD · +{selectedQuest.type === 'weekly' ? XP.BOUNTY : XP.QUEST} {selectedQuest.skill} XP{selectedQuest.type === 'weekly' ? ' · GUARANTEED LOOT' : ''}
                        <span className="meaning"> · {selectedQuest.type === 'daily' ? 'resets at dawn' : selectedQuest.type === 'weekly' ? 'resets monday' : 'once'}</span>
                      </div>
                      <div style={{ marginTop: '3rem' }}>
                        {confirmAbandon ? (
                          <span className="inline-actions">
                            <button onClick={() => { void deleteQuest(selectedQuest.id); setConfirmAbandon(false); }} className="btn-ghost small danger skyrim-font">CONFIRM ABANDON</button>
                            <button onClick={() => setConfirmAbandon(false)} className="btn-ghost small skyrim-font">KEEP</button>
                          </span>
                        ) : <button onClick={() => setConfirmAbandon(true)} className="btn-ghost small danger skyrim-font">ABANDON QUEST</button>}
                      </div>
                    </>
                  ) : <div className="empty-detail"><p className="skyrim-serif">Select a quest</p></div>}
                </div>
              </div>
            )}

            {activeTab === 'STATS' && (
              <div className="stats-layout">
                <div className="skyrim-card">
                  <h2 className="skyrim-title centered">LINEAGE OF SPIRIT</h2>
                  <Suspense fallback={<p className="skyrim-serif muted">Reading the stars...</p>}>
                    <StatsChart entries={entries} />
                  </Suspense>
                </div>
                <div className="stats-grid">
                  <div className="skyrim-card">
                    <h3 className="skyrim-font card-title">CHARACTER</h3>
                    <div className="stat-row"><span>Level</span><b>{stats.level}</b></div>
                    <div className="stat-row"><span>Experience</span><b>{stats.xp} / {stats.xpToNextLevel}</b></div>
                    <div className="stat-row"><span>Skill Points</span><b className="gold">{stats.skillPoints}</b></div>
                    <div className="stat-row"><span>Quests Done</span><b>{stats.completedQuestCount}</b></div>
                    <div className="stat-row"><span>Race</span><b>{stats.race}</b></div>
                    <div className="stat-row"><span>Log Streak</span><b className="gold">{streak} days</b></div>
                    <div className="stat-row"><span>Best Streak</span><b>{Math.max(stats.bestStreak, streak)} days</b></div>
                    <div className="stat-row"><span>Chronicles</span><b>{entries.length}</b></div>
                    <div className="stat-row"><span>Dailies today</span><b>{quests.filter(q => q.type === 'daily' && q.completed).length} / {quests.filter(q => q.type === 'daily').length}</b></div>
                  </div>
                  <div className="skyrim-card">
                    <h3 className="skyrim-font card-title">VITALS</h3>
                    <div className="stat-row"><span>Health</span><b style={{ color: '#e05a4e' }}>{stats.health} / {stats.healthMax}</b></div>
                    <div className="stat-row"><span>Magicka</span><b style={{ color: '#3d8de0' }}>{stats.magicka} / {stats.magickaMax}</b></div>
                    <div className="stat-row"><span>Stamina</span><b style={{ color: '#3fae3c' }}>{stats.stamina} / {stats.staminaMax}</b></div>
                    <div className="stat-row"><span>Active Perks</span><b className="gold">{stats.perks.length}</b></div>
                    <div className="stat-row"><span>Inventory</span><b>{stats.inventory.length}</b></div>
                  </div>
                </div>
                <div className="stats-grid">
                  <div className="skyrim-card">
                    <h3 className="skyrim-font card-title">LAST 7 DAYS</h3>
                    {(() => {
                      const { current, previous } = periodSummary(entries);
                      const arrow = (a: number | null, b: number | null) => a === null || b === null ? '' : a > b ? ' ▲' : a < b ? ' ▼' : ' ·';
                      const col = (a: number | null, b: number | null) => a === null || b === null ? '#fff' : a > b ? '#3fae3c' : a < b ? '#e05a4e' : '#fff';
                      return (
                        <>
                          <div className="stat-row"><span>Logs scribed</span><b>{current.logs} <span className="meaning">(prev {previous.logs})</span></b></div>
                          <div className="stat-row"><span>Health <span className="meaning">(mood)</span></span><b style={{ color: col(current.mood, previous.mood) }}>{current.mood ?? '—'}{arrow(current.mood, previous.mood)}</b></div>
                          <div className="stat-row"><span>Stamina <span className="meaning">(energy)</span></span><b style={{ color: col(current.energy, previous.energy) }}>{current.energy ?? '—'}{arrow(current.energy, previous.energy)}</b></div>
                          <div className="stat-row"><span>Magicka <span className="meaning">(rest, hours)</span></span><b style={{ color: col(current.sleep, previous.sleep) }}>{current.sleep ?? '—'}{arrow(current.sleep, previous.sleep)}</b></div>
                          <p className="skyrim-serif meaning" style={{ marginTop: '0.8rem' }}>Averages of your logs, compared with the seven days before.</p>
                        </>
                      );
                    })()}
                  </div>
                  <div className="skyrim-card">
                    <h3 className="skyrim-font card-title">MASTERY</h3>
                    {(() => {
                      const totalPerks = CONSTELLATIONS.reduce((n, c) => n + c.perks.length, 0);
                      const best = Object.entries(stats.skills).sort((a, b) => b[1].level - a[1].level)[0];
                      const trained = Object.entries(stats.questCompletions).sort((a, b) => b[1] - a[1])[0];
                      const stone = stoneById(stats.standingStone);
                      return (
                        <>
                          <div className="stat-row"><span>Highest skill</span><b>{best ? `${best[0]} ${best[1].level}` : '—'}</b></div>
                          <div className="stat-row"><span>Most trained</span><b>{trained ? `${trained[0]} · ${trained[1]} quests` : '—'}</b></div>
                          <div className="stat-row"><span>Total skill levels</span><b>{Object.values(stats.skills).reduce((n, s) => n + s.level, 0)}</b></div>
                          <div className="stat-row"><span>Perks unlocked</span><b className="gold">{stats.perks.length} / {totalPerks}</b></div>
                          <div className="stat-row"><span>Standing stone</span><b>{stone ? `${stone.icon} ${stone.name.replace('The ', '').replace(' Stone', '')}` : 'None'}</b></div>
                          <div className="stat-row"><span>Equipped</span><b>{stats.inventory.find(i => i.uid === stats.equippedItemId)?.name ?? 'Nothing'}</b></div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="skyrim-card">
                  <StandingStones />
                </div>
                <div className="skyrim-card">
                  <h3 className="skyrim-font card-title">SKILLS</h3>
                  <div className="skills-grid">
                    {CONSTELLATIONS.map(con => {
                      const data = stats.skills[con.skillKey] ?? { level: 0, xp: 0, xpToNextLevel: 100 };
                      const owned = con.perks.filter(p => stats.perks.includes(p.id)).length;
                      return (
                        <div key={con.skillKey} className="skill-stat">
                          <div className="skill-stat-head">
                            <span className="skyrim-font">{con.name} <span className="meaning">· {skillMeaning(con.skillKey)}</span></span>
                            <b>{data.level}</b>
                          </div>
                          <div className="skill-progress-bar-container"><div className="skill-progress-bar-fill" style={{ width: `${(data.xp / data.xpToNextLevel) * 100}%` }} /></div>
                          <div className="skyrim-serif meaning">{data.xp}/{data.xpToNextLevel} XP · {owned}/{con.perks.length} perks · {stats.questCompletions[con.skillKey] ?? 0} quests</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'JOURNAL' && (
              <div className="quest-menu-layout">
                <div className="quest-list-column">
                  <div className="column-head">
                    <div className="quest-category-title" style={{ margin: 0 }}>Past Chronicles</div>
                    <button onClick={() => { setIsAddLogOpen(true); playSound('UI_CLICK'); }} className="add-quest-btn-plus" aria-label="Scribe a log">+</button>
                  </div>
                  {streak > 0 && <div className="streak-pill skyrim-font">🔥 {streak} DAY STREAK</div>}
                  <div className="scroll-list">
                    {entries.length === 0 && <p className="skyrim-serif muted">No chronicles yet. Press + to scribe today.</p>}
                    {entries.map(e => (
                      <div key={e.id} className={`quest-list-item ${selectedEntry?.id === e.id ? 'active' : ''}`} onClick={() => { setSelectedEntryId(e.id); playSound('UI_CLICK'); }}>
                        <div className="quest-diamond filled small" />
                        <div className="quest-list-text">
                          <span className="skyrim-font">{e.timestamp.toDate().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          <span className="skyrim-serif quest-meta">mood {e.mood} · energy {e.energy} · {e.sleep}h{e.highlights?.filter(Boolean).length ? ` · ${e.highlights.filter(Boolean).length} triumph${e.highlights.filter(Boolean).length === 1 ? '' : 's'}` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="quest-details-column">
                  {selectedEntry ? (
                    <>
                      <h1 className="skyrim-font detail-title">{selectedEntry.timestamp.toDate().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</h1>
                      <div className="menu-separator wide" />
                      <div className="entry-vitals skyrim-font">
                        <div style={{ color: '#e05a4e' }}>HEALTH {selectedEntry.mood}/10 <span className="meaning">mood</span></div>
                        <div style={{ color: '#3d8de0' }}>MAGICKA {selectedEntry.sleep}h <span className="meaning">rest</span></div>
                        <div style={{ color: '#3fae3c' }}>STAMINA {selectedEntry.energy}/10 <span className="meaning">energy</span></div>
                      </div>
                      <div className="quest-category-title">Daily Triumphs</div>
                      <ul className="skyrim-serif triumph-list">
                        {selectedEntry.highlights?.filter(Boolean).map((h, i) => <li key={i}>{h}</li>)}
                        {(!selectedEntry.highlights || selectedEntry.highlights.every(h => !h)) && <li>No triumphs recorded for this day.</li>}
                      </ul>
                      <div style={{ marginTop: '2rem' }}>
                        <button onClick={() => void deleteEntry(selectedEntry.id)} className="btn-ghost small danger skyrim-font">BURN THIS PAGE</button>
                      </div>
                    </>
                  ) : <div className="empty-detail"><p className="skyrim-serif">No chronicles found</p></div>}
                </div>
              </div>
            )}

            {activeTab === 'SYSTEM' && <SystemSettings />}
          </div>

          <div className="pause-footer skyrim-font">[ ESC TO RESUME ]</div>
        </div>
      </div>

      <Modal open={isAddQuestOpen} onClose={() => setIsAddQuestOpen(false)} title="NEW QUEST">
        <QuestForm adding={adding} onSubmit={addQuest} onDone={q => { if (q) { setSelectedQuestId(q.id); setIsAddQuestOpen(false); playSound('UI_CLICK'); } }} onCancel={() => setIsAddQuestOpen(false)} />
      </Modal>

      <Modal open={isAddLogOpen} onClose={() => setIsAddLogOpen(false)} title="SCRIBE DAILY LOG" width={600}>
        <LogForm saving={saving} streak={streak} onSubmit={async (...args) => { const ok = await addEntry(...args); if (ok) setIsAddLogOpen(false); return ok; }} onCancel={() => setIsAddLogOpen(false)} />
      </Modal>
    </>
  );
};

export default PauseMenu;
