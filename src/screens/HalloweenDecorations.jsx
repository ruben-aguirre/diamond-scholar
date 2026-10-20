function Pumpkin() {
  return (
    <svg viewBox="0 0 120 110" focusable="false">
      <path d="M56 26Q49 8 66 3L75 9Q61 13 65 27" fill="#709543" stroke="#354c29" strokeWidth="3" />
      <path d="M65 22Q84 11 91 24Q81 32 65 26" fill="#86af4e" />
      <ellipse cx="60" cy="63" rx="55" ry="42" fill="#eb7418" stroke="#a84613" strokeWidth="3" />
      <ellipse cx="60" cy="63" rx="37" ry="42" fill="#f58c24" stroke="#d15e16" strokeWidth="2" />
      <ellipse cx="60" cy="63" rx="17" ry="42" fill="#ff9f32" stroke="#e6761b" strokeWidth="2" />
      <path d="M22 53L43 39L47 59Z M73 59L77 39L98 53Z M54 66L61 54L68 66Z" fill="#542512" />
      <path d="M24 72L40 78L42 70L53 73L54 82L67 82L69 73L80 70L81 78L98 72Q61 113 24 72" fill="#542512" />
      <path d="M28 51L42 43L44 55Z M77 55L79 43L92 51Z" fill="#ffd967" />
      <path d="M31 80L40 83L48 80L54 88L67 88L74 80L82 83L91 80Q61 103 31 80" fill="#ffd967" />
      <path d="M17 43Q21 34 29 32" stroke="#ffd085" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function Candy() {
  return (
    <svg viewBox="0 0 120 80" focusable="false">
      <path d="M35 27L8 12L14 37L6 61L36 52M85 27L112 12L106 38L114 63L84 52" fill="currentColor" stroke="#fff6" strokeWidth="2" />
      <path d="M12 20L32 34M12 55L32 44M108 20L88 34M108 55L88 44" stroke="#48275f" strokeWidth="3" />
      <rect x="28" y="16" width="64" height="48" rx="21" fill="currentColor" stroke="#fff9" strokeWidth="2" />
      <path d="M45 19L32 45Q32 57 42 61L65 17M78 19L55 63L71 62L89 30" fill="#fff5" />
      <path d="M45 25L69 25" stroke="#fff9" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export default function HalloweenDecorations({ garland = false }) {
  const items = garland
    ? ['pumpkin', 'candy', 'candy', 'pumpkin', 'candy', 'candy', 'pumpkin']
    : ['pumpkin', 'candy', 'candy', 'pumpkin', 'candy', 'pumpkin', 'candy', 'candy'];
  return (
    <div className={garland ? 'halloween-garland' : 'halloween-yard'} aria-hidden="true">
      {items.map((kind, i) => (
        <span key={i} className={`halloween-piece piece-${i} ${kind}`}>
          {kind === 'pumpkin' ? <Pumpkin /> : <Candy />}
        </span>
      ))}
    </div>
  );
}
