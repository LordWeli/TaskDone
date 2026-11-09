import type { DailyProgress } from './progress';
import './ProgressRing.css';

const SIZE = 72;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function caption({ done, total }: DailyProgress): string {
  if (total === 0) return 'Nothing planned yet';
  if (done === total) return 'Everything done today';
  const left = total - done;
  return left === 1 ? '1 task to go' : `${left} tasks to go`;
}

export function ProgressRing({ progress }: { progress: DailyProgress }) {
  const { done, total, fraction } = progress;
  const valueText = `${done} of ${total} tasks done`;
  return (
    <div className="progress">
      <div
        className="progress__ring"
        role="progressbar"
        aria-label="Today's progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(fraction * 100)}
        aria-valuetext={valueText}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} aria-hidden="true">
          <circle
            className="progress__track"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE}
          />
          <circle
            className="progress__value"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <span className="progress__fraction" aria-hidden="true">
          {done}/{total}
        </span>
      </div>
      <div className="progress__text" aria-hidden="true">
        <p className="progress__title">Today</p>
        <p className="progress__caption">{caption(progress)}</p>
      </div>
    </div>
  );
}
