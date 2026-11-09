import type { Ref } from 'react';
import type { GamificationView } from './useGamification';
import './BadgesDialog.css';

const dateFormat = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

interface Props {
  view: GamificationView;
  ref: Ref<HTMLDialogElement>;
}

export function BadgesDialog({ view, ref }: Props) {
  return (
    <dialog
      ref={ref}
      className="badges"
      aria-labelledby="badges-title"
      onClick={(e) => {
        // Click on the backdrop closes the dialog.
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="badges__inner">
        <div className="badges__head">
          <h2 id="badges-title" className="badges__title">
            Badges
          </h2>
          <form method="dialog">
            <button type="submit" className="badges__close" aria-label="Close badges">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </form>
        </div>
        <p className="badges__summary">
          Longest streak: {view.longestStreak === 1 ? '1 day' : `${view.longestStreak} days`}
        </p>
        <ul className="badges__list">
          {view.badges.map((badge) => {
            const unlocked = badge.unlockedAt !== null;
            return (
              <li key={badge.id} className={`badge ${unlocked ? 'badge--unlocked' : ''}`}>
                <span className="badge__icon" aria-hidden="true">
                  {unlocked ? (
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <path
                        d="M12 2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 16.8 6.1 20l1.3-6.5L2.5 8.9l6.6-.8L12 2z"
                        fill="currentColor"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                      <rect
                        x="5"
                        y="11"
                        width="14"
                        height="10"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </span>
                <div>
                  <p className="badge__name">{badge.name}</p>
                  <p className="badge__desc">{badge.description}</p>
                  <p className="badge__state">
                    {badge.unlockedAt !== null
                      ? `Unlocked ${dateFormat.format(badge.unlockedAt)}`
                      : 'Locked'}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </dialog>
  );
}
