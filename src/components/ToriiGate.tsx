export default function ToriiGate({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 140"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* kasagi — top curved beam */}
      <path d="M6 34 Q100 12 194 34 L194 46 Q100 24 6 46 Z" fill="#d43b2a" />
      {/* shimaki — secondary beam */}
      <path d="M14 52 Q100 36 186 52 L186 60 Q100 44 14 60 Z" fill="#b72a1c" />
      {/* gakuzuka — center plaque */}
      <rect x="88" y="60" width="24" height="34" rx="2" fill="#171422" />
      <text
        x="100"
        y="84"
        textAnchor="middle"
        fontSize="15"
        fill="#d4af37"
        fontFamily="serif"
      >
        将
      </text>
      {/* nuki — tie beam */}
      <rect x="16" y="96" width="168" height="8" rx="2" fill="#b72a1c" />
      {/* pillars */}
      <path d="M20 40 L34 40 L36 132 L22 132 Z" fill="#d43b2a" />
      <path d="M166 40 L180 40 L178 132 L164 132 Z" fill="#d43b2a" />
      {/* bases */}
      <rect x="18" y="132" width="20" height="6" rx="2" fill="#171422" />
      <rect x="162" y="132" width="20" height="6" rx="2" fill="#171422" />
    </svg>
  );
}
