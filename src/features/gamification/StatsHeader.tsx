import { useRef } from 'react';
import { BadgesDialog } from './BadgesDialog';
import type { GamificationView } from './useGamification';
import './StatsHeader.css';

interface Props {
  view: GamificationView;
  /** Latest XP gain, shown as a short float; key changes per gain. */
  xpPop: { amount: number; key: number } | null;
}

function streakLabel(view: GamificationView): string {
  if (view.streak === 0) return 'Start a streak today';
  const days = view.streak === 1 ? '1-day streak' : `${view.streak}-day streak`;
  return view.streakNeedsToday ? `${days}, keep it going today` : days;
}

export function StatsHeader({ view, xpPop }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nextLevel = view.level + 1;

  return (
    <div className="stats">
      <div className="stats__level">
        <span key={view.level} className="stats__level-badge">
          <span className="visually-hidden">Level </span>
          <span aria-hidden="true">Lv</span>
          {view.level}
        </span>
        <div className="stats__xp">
          <div
            className="stats__xp-bar"
            role="progressbar"
            aria-label="Experience"
            aria-valuemin={0}
            aria-valuemax={view.xpForNext}
            aria-valuenow={view.xpIntoLevel}
            aria-valuetext={`${view.xpIntoLevel} of ${view.xpForNext} XP to level ${nextLevel}`}
          >
            <span className="stats__xp-fill" style={{ transform: `scaleX(${view.fraction})` }} />
          </div>
          <span className="stats__xp-text" aria-hidden="true">
            {view.xpIntoLevel}/{view.xpForNext} XP
          </span>
          {xpPop && xpPop.amount > 0 && (
            <span key={xpPop.key} className="stats__xp-pop" aria-hidden="true">
              +{xpPop.amount} XP
            </span>
          )}
        </div>
      </div>
      <div className="stats__row">
        <p className={`stats__streak ${view.streak > 0 ? 'stats__streak--on' : ''}`}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
            <path
              d="M12 2c1 3.5-1.5 5.2-2.6 7.4C8.3 11.6 8 13 8.6 14.6 7.4 14 6.6 12.9 6.4 11.6 4.9 13.3 4.5 15 5 17c.9 3.2 3.8 5 7 5s6.4-2.2 6.9-5.6c.5-3.3-1-6.1-3.2-8.3-.2 1.5-.9 2.6-2 3.3.6-3.6-.2-7-1.7-10.1Z"
              fill="currentColor"
            />
          </svg>
          {streakLabel(view)}
        </p>
        <button
          type="button"
          className="stats__badges-button"
          onClick={() => dialogRef.current?.showModal()}
        >
          Badges {view.unlockedCount}/{view.badges.length}
        </button>
      </div>
      <BadgesDialog ref={dialogRef} view={view} />
    </div>
  );
}
