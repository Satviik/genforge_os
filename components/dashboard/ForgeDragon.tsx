export function ForgeDragon() {
  return (
    <svg viewBox="0 0 220 220" className="h-auto w-full drop-shadow-[0_0_18px_rgba(255,106,0,0.35)]" aria-hidden="true">
      <defs>
        <linearGradient id="dragon-body" x1="40" y1="20" x2="190" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF8A33" />
          <stop offset="1" stopColor="#C24E00" />
        </linearGradient>
      </defs>
      <polygon points="110,18 148,42 132,78 92,70 78,40" fill="#1b120c" stroke="#FF6A00" strokeWidth="1.4" />
      <polygon points="148,42 186,70 168,108 132,78" fill="#2a160c" stroke="#FF6A00" strokeWidth="1.4" />
      <polygon points="78,40 92,70 58,112 38,74" fill="#24140c" stroke="#FF6A00" strokeWidth="1.4" />
      <polygon points="92,70 132,78 128,128 72,124" fill="url(#dragon-body)" stroke="#FF8A33" strokeWidth="1.2" />
      <polygon points="132,78 168,108 158,150 128,128" fill="#d45a00" stroke="#FF6A00" strokeWidth="1.2" />
      <polygon points="58,112 72,124 64,168 34,148" fill="#8a3a12" stroke="#FF6A00" strokeWidth="1.2" />
      <polygon points="72,124 128,128 118,186 70,176" fill="#a84400" stroke="#FF6A00" strokeWidth="1.2" />
      <polygon points="128,128 158,150 148,196 118,186" fill="#6b2c0c" stroke="#FF6A00" strokeWidth="1.2" />
      <polygon points="148,42 168,28 186,70" fill="#FF6A00" />
      <polygon points="38,74 28,108 34,148 18,126" fill="#3a1c0c" stroke="#FF6A00" strokeWidth="1.2" />
      <circle cx="124" cy="58" r="4" fill="#F5F1EC" />
      <circle cx="124" cy="58" r="2" fill="#080706" />
    </svg>
  );
}
