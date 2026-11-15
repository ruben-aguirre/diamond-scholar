import { useEffect, useRef, useState } from 'react';
import { getLeague, PLAYER_TEAM_ID } from '../game/league';
import { MIN_ROSTER, offerPlayer, saleAcceptanceChance } from '../game/playerSales';

export default function PlayerSaleDialog({ profile, playerId, onUpdateProfile, onClose }) {
  const dialog = useRef(null);
  const submitted = useRef(false);
  const [player] = useState(() => profile.roster.find((p) => p.id === playerId));
  const teams = getLeague(profile).teams.filter((team) => team.id !== PLAYER_TEAM_ID);
  const [teamId, setTeamId] = useState(teams[0].id);
  const [price, setPrice] = useState(50);
  const [result, setResult] = useState(null);
  const team = teams.find((t) => t.id === teamId);
  const canSell = profile.roster.length > MIN_ROSTER;

  useEffect(() => { dialog.current.showModal(); }, []);

  function changeOffer() {
    submitted.current = false;
    setResult(null);
  }

  function askTeam(e) {
    e.preventDefault();
    if (submitted.current) return;
    submitted.current = true;
    const roll = Math.random();
    const answer = offerPlayer(profile, playerId, teamId, price, roll);
    if (answer.status === 'accepted') {
      onUpdateProfile((current) => offerPlayer(current, playerId, teamId, price, roll).updates || {});
    }
    setResult(answer.status);
  }

  return (
    <dialog ref={dialog} className="player-sale-dialog" aria-labelledby="sale-title" onCancel={onClose}>
      <h2 id="sale-title">{result === 'accepted' ? 'They said yes!' : `Sell ${player.name}`}</h2>
      {result === 'accepted' ? <>
        <p role="status"><strong>{player.name}</strong> joined <strong>{team.name}</strong>. You received <strong>{price} coins</strong>!</p>
        <p>You can see their new team in Team Standings.</p>
        <button className="btn btn-primary" autoFocus onClick={onClose}>Done</button>
      </> : !canSell ? <>
        <p>You need to keep {MIN_ROSTER} players. Get another player from Card Shop or Draft Day first!</p>
        <button className="btn btn-primary" autoFocus onClick={onClose}>Got it</button>
      </> : <form onSubmit={askTeam}>
        <label htmlFor="sale-team">Which team?</label>
        <select id="sale-team" value={teamId} autoFocus onChange={(e) => { setTeamId(e.target.value); changeOffer(); }}>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <label htmlFor="sale-price">Asking price: <strong>{price} coins</strong></label>
        <input id="sale-price" type="range" min="0" max="100" step="1" value={price}
          aria-valuetext={`${price} coins`} aria-describedby="sale-chance"
          onChange={(e) => { setPrice(Number(e.target.value)); changeOffer(); }} />
        <div className="sale-range-labels" aria-hidden="true"><span>0 coins</span><span>100 coins</span></div>
        <p id="sale-chance"><strong>{Math.round(saleAcceptanceChance(price) * 100)}% chance of a yes.</strong><br />Higher prices mean more no answers.</p>
        <p>If they say yes, {player.name} moves to their team and you get {price} coins.{price === 0 && ' This gives the player away for free.'}</p>
        {result && <p className="sale-answer" role="status">{result === 'declined'
          ? `${team.name} said no. Try a lower price or a different team! Your player stays with you.`
          : 'This player cannot be sold right now. Close this window and check your team.'}</p>}
        <div className="sale-actions">
          <button className="btn btn-primary" disabled={Boolean(result)} type="submit">Ask team</button>
          <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>}
    </dialog>
  );
}
