export default function DidYouKnowCard({ fact, onClose }) {
  return (
    <div className="dyk-backdrop">
      <div className="dyk-card">
        <button className="dyk-close" onClick={onClose} aria-label="Close">
          &#x2715;
        </button>
        <span className="dyk-label">Did You Know?</span>
        <p className="dyk-fact">{fact.fact}</p>
      </div>
    </div>
  );
}
