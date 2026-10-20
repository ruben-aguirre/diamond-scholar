const BURSTS = [
  [15, 23, '#ffb347', 0], [78, 18, '#b798ff', 0.45],
  [42, 12, '#aaff87', 0.9], [89, 52, '#ffcf61', 1.3],
  [10, 64, '#b798ff', 1.7], [64, 34, '#ff945c', 2.1],
];

export default function WinFireworks({ season, won }) {
  if (season?.id !== 'halloween' || !won) return null;
  return (
    <div className="win-fireworks" aria-hidden="true">
      {BURSTS.map(([left, top, color, delay], index) => (
        <div className="firework-burst" key={index} style={{ left: `${left}%`, top: `${top}%`, color, '--delay': `${delay}s` }}>
          <i className="firework-rocket" />
          {Array.from({ length: 18 }, (_, i) => (
            <span className="firework-ray" key={i} style={{ transform: `rotate(${i * 20}deg)` }}>
              <i className="firework-spark" />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
