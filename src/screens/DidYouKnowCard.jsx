import { useEffect, useState } from 'react';

export default function DidYouKnowCard({ fact, onClose }) {
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCanClose(true), 5000);
    return () => clearTimeout(t);
  }, [fact]);

  return (
    <div className="dyk-backdrop">
      <div className="dyk-card">
        {canClose && (
          <button className="dyk-close" onClick={onClose} aria-label="Close">
            &#x2715;
          </button>
        )}
        <span className="dyk-label">Did You Know?</span>
        <p className="dyk-fact">{fact.fact}</p>
      </div>
    </div>
  );
}
