export default function ProfileSelect({ profiles, onSelect, onCreateNew }) {
  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1 className="setup-title">Who's Playing?</h1>
        <div className="profile-list">
          {profiles.map((p) => (
            <button key={p.id} className="profile-card" onClick={() => onSelect(p.id)}>
              <div className="profile-avatar" style={{ backgroundColor: p.teamColor.primary }}>
                {p.name[0].toUpperCase()}
              </div>
              <div className="profile-info">
                <span className="profile-name">{p.name}</span>
                <span className="profile-team">The {p.teamName}</span>
              </div>
              <div className="profile-coins">
                <span className="coin-icon">&#x1FA99;</span> {p.coins}
              </div>
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={onCreateNew}>
          + New Player
        </button>
      </div>
    </div>
  );
}
