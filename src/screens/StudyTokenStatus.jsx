export default function StudyTokenStatus({ progress, balance = 0 }) {
  return (
    <div className="study-token-status" role="status" aria-live="polite" aria-atomic="true">
      {progress.tokensEarned > 0 && <strong>🎟️ {progress.tokensEarned} {progress.tokensEarned === 1 ? 'token earned' : 'tokens earned'}! Saved to your wallet.</strong>}
      <span>🎟️ Your tokens: {balance}</span>
      <span>{progress.streak} / 5 right in a row toward your next token</span>
    </div>
  );
}
