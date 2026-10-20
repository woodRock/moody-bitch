import { useCallback, useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import type { Spell } from '../game/spells';

/** Casting logic shared by the desktop Magic screen and the mobile Magic tab. */
export function useSpellbook() {
  const { castSpell, notify, startSurge, startSlowTime, toggleZenMode, spendShout } = useGame();
  const { playSound } = useSound();
  const [casting, setCasting] = useState<Spell['id'] | null>(null);

  const cast = useCallback(async (spell: Spell) => {
    if (spell.school === 'SHOUTS') {
      if (spell.id === 'feim') { notify('SHOUT UNLEASHED', spell.words?.join(' ') ?? ''); playSound('SPELL_CAST'); await toggleZenMode(); return; }
      if (!(await spendShout())) return;
      notify('SHOUT UNLEASHED', spell.words?.join(' ') ?? '');
      playSound('SPELL_CAST');
      if (spell.id === 'fus') await startSurge(5);
      else if (spell.id === 'tiid') await startSlowTime(10);
      return;
    }
    if (await castSpell(spell.cost, spell.name)) setCasting(spell.id);
  }, [castSpell, notify, playSound, startSurge, startSlowTime, toggleZenMode, spendShout]);

  return { casting, setCasting, cast };
}
