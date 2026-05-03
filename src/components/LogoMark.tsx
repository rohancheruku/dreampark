/** Nav mark: star / sparkle cluster matching favicon */
export function LogoMark() {
  return (
    <svg
      className="site-logo__mark"
      viewBox="0 0 32 32"
      width="32"
      height="32"
      aria-hidden
    >
      <defs>
        <linearGradient id="navLogoBg" x1="4" y1="4" x2="28" y2="28">
          <stop stopColor="#0b1020" />
          <stop offset="1" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="navLogoStar" x1="8" y1="6" x2="26" y2="28">
          <stop stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#f8fafc" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#navLogoBg)" />
      <g fill="url(#navLogoStar)">
        <path
          className="site-logo__sparkle site-logo__sparkle--main"
          d="M16 5.5 18.2 13.5 26.5 16 18.2 18.5 16 26.5 13.8 18.5 5.5 16 13.8 13.5Z"
        />
        <path
          className="site-logo__sparkle site-logo__sparkle--s1"
          opacity="0.92"
          transform="translate(6 7) scale(0.32)"
          d="M16 5.5 18.2 13.5 26.5 16 18.2 18.5 16 26.5 13.8 18.5 5.5 16 13.8 13.5Z"
        />
        <path
          className="site-logo__sparkle site-logo__sparkle--s2"
          opacity="0.88"
          transform="translate(22 6) scale(0.28)"
          d="M16 5.5 18.2 13.5 26.5 16 18.2 18.5 16 26.5 13.8 18.5 5.5 16 13.8 13.5Z"
        />
        <path
          className="site-logo__sparkle site-logo__sparkle--s3"
          opacity="0.85"
          transform="translate(20 22) scale(0.26)"
          d="M16 5.5 18.2 13.5 26.5 16 18.2 18.5 16 26.5 13.8 18.5 5.5 16 13.8 13.5Z"
        />
      </g>
    </svg>
  );
}
