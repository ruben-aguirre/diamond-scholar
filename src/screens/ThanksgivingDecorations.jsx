function HarvestArt({ kind }) {
  return (
    <svg viewBox="0 0 140 140" focusable="false">
      {kind === 'turkey' ? <>
        <g stroke="#7c3c21" strokeWidth="3">
          <ellipse cx="70" cy="51" rx="18" ry="42" fill="#dc9931" />
          <ellipse cx="48" cy="57" rx="17" ry="40" transform="rotate(-32 48 57)" fill="#bd4e2d" />
          <ellipse cx="92" cy="57" rx="17" ry="40" transform="rotate(32 92 57)" fill="#bd4e2d" />
          <ellipse cx="32" cy="77" rx="16" ry="34" transform="rotate(-58 32 77)" fill="#e6b646" />
          <ellipse cx="108" cy="77" rx="16" ry="34" transform="rotate(58 108 77)" fill="#e6b646" />
        </g>
        <path d="M59 115v15m-9 0h18m13-15v15m-9 0h18" stroke="#a95b1e" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="70" cy="93" rx="34" ry="29" fill="#804326" />
        <ellipse cx="70" cy="101" rx="22" ry="17" fill="#a66337" />
        <circle cx="70" cy="67" r="22" fill="#c18b55" />
        <circle cx="62" cy="63" r="5" fill="white" /><circle cx="79" cy="63" r="5" fill="white" />
        <circle cx="63" cy="64" r="2.5" fill="#30231d" /><circle cx="78" cy="64" r="2.5" fill="#30231d" />
        <ellipse cx="76" cy="80" rx="5" ry="10" fill="#bd3e32" />
        <path d="M62 71h17l-9 10z" fill="#ffc655" />
        <path d="M48 54q22-13 44 0l-4-13H54z" fill="#284f65" />
        <path d="M65 53h31" stroke="#193b4e" strokeWidth="6" strokeLinecap="round" />
      </> : kind === 'pumpkin' ? <>
        <path d="M67 36q-9-20 10-24l7 8q-14 3-9 17" fill="#667b35" />
        <ellipse cx="70" cy="81" rx="60" ry="44" fill="#d56b25" stroke="#a64b1d" strokeWidth="3" />
        <ellipse cx="70" cy="81" rx="40" ry="44" fill="#e98632" stroke="#bb571e" strokeWidth="2" />
        <ellipse cx="70" cy="81" rx="18" ry="44" fill="#f4a044" stroke="#d67427" strokeWidth="2" />
        <path d="M78 38q21-24 35-9-12 21-35 9" fill="#7e913d" />
        <path d="M27 62q5-9 13-11" fill="none" stroke="#ffd397" strokeWidth="5" strokeLinecap="round" />
      </> : <>
        <path d="M70 14l13 28 21-11-5 27 26 5-20 24 6 17-35-5-6 21-6-21-35 5 6-17L15 63l26-5-5-27 21 11z" fill="currentColor" />
        <path d="M70 39v91M70 79L47 59m23 32 27-23" fill="none" stroke="#884623" strokeWidth="4" strokeLinecap="round" />
      </>}
    </svg>
  );
}

export default function ThanksgivingDecorations({ garland = false }) {
  const items = garland ? ['leaf', 'pumpkin', 'leaf', 'turkey', 'leaf', 'pumpkin', 'leaf'] : ['turkey', 'pumpkin', 'leaf', 'turkey', 'pumpkin', 'leaf'];
  return (
    <div className={garland ? 'thanksgiving-garland' : 'thanksgiving-yard'} aria-hidden="true">
      {items.map((kind, i) => (
        <span key={i} className={`harvest-piece harvest-${i} ${kind}`}><HarvestArt kind={kind} /></span>
      ))}
    </div>
  );
}
