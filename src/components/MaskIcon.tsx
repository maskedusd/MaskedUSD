interface MaskIconProps {
  className?: string;
  /** Pixel width; height scales to the 120:64 aspect ratio. */
  width?: number;
}

/**
 * MaskedUSD brand mark — a lavender domino mask.
 * Inline SVG so it renders identically across platforms (unlike the emoji)
 * and stays crisp at any size.
 */
export default function MaskIcon({ className = "", width = 40 }: MaskIconProps) {
  return (
    <svg
      viewBox="0 0 120 64"
      width={width}
      height={(width * 64) / 120}
      role="img"
      aria-label="MaskedUSD"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id="maskFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78cec" />
          <stop offset="100%" stopColor="#8b6fe0" />
        </linearGradient>
      </defs>
      <path
        d="M14 14
           C 8 14, 4 22, 4 32
           C 4 46, 14 56, 28 56
           L 50 56
           C 56 56, 58 50, 60 50
           C 62 50, 64 56, 70 56
           L 92 56
           C 106 56, 116 46, 116 32
           C 116 22, 112 14, 106 14
           C 96 14, 86 18, 78 22
           C 72 25, 66 26, 60 26
           C 54 26, 48 25, 42 22
           C 34 18, 24 14, 14 14 Z"
        fill="url(#maskFill)"
      />
      <ellipse cx="32" cy="34" rx="9" ry="6" fill="#f6f2fb" />
      <ellipse cx="88" cy="34" rx="9" ry="6" fill="#f6f2fb" />
      <ellipse cx="29" cy="32" rx="2.4" ry="1.6" fill="#6b4fcf" opacity="0.55" />
      <ellipse cx="85" cy="32" rx="2.4" ry="1.6" fill="#6b4fcf" opacity="0.55" />
    </svg>
  );
}
