import { useEffect } from 'react';

export default function SeasonalFrame({ season, children }) {
  useEffect(() => {
    if (season) document.documentElement.dataset.season = season.id;
    else delete document.documentElement.dataset.season;
    return () => { delete document.documentElement.dataset.season; };
  }, [season]);

  const decorations = season?.id === 'halloween' ? '🎃 🍬 🎃 🍭 🎃' : '🎄 🎁 🎄 🎁 🎄';
  return (
    <div className="seasonal-app">
      {season && (
        <div className="holiday-banner">
          <div className="holiday-lights" aria-hidden="true">
            {Array.from({ length: 16 }, (_, i) => <i key={i} />)}
          </div>
          <span aria-hidden="true">{season.emoji}</span>
          <strong>{season.name} at the ballpark</strong>
          <span aria-hidden="true">{season.id === 'halloween' ? '🍬' : '🎁'}</span>
        </div>
      )}
      {children}
      {season && <div className="holiday-scenery" aria-hidden="true">{decorations}</div>}
    </div>
  );
}
