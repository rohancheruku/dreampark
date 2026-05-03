import { useEffect, useState } from "react";

const SPOKES = 12;
const R = 168;
const CABLE_LEN = 16;
/** One full turn every 100s */
const SEC_PER_REV = 100;

export function FerrisWheelBg() {
  const cabinAngles = Array.from({ length: SPOKES }, (_, i) => (360 / SPOKES) * i);
  const [wheelDeg, setWheelDeg] = useState(0);

  useEffect(() => {
    let id = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const elapsed = (now - t0) / 1000;
      setWheelDeg(((elapsed / SEC_PER_REV) * 360) % 360);
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="ferris-wheel-bg" aria-hidden>
      <div className="ferris-wheel-bg__aurora" />
      <svg className="ferris-wheel-bg__svg" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="fw-rim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.75" />
            <stop offset="45%" stopColor="#a78bfa" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="fw-spoke" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(226,232,240,0.2)" />
            <stop offset="100%" stopColor="rgba(248,250,252,0.55)" />
          </linearGradient>
          <radialGradient id="fw-hub" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#94a3b8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
          </radialGradient>
          <filter id="fw-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Compact A-frame under the axle */}
        <path
          d="M 558 426 L 600 252 L 642 426 Z"
          fill="rgba(15,22,41,0.45)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.2"
        />
        <line x1="600" y1="252" x2="600" y2="426" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />

        <g transform="translate(600,248)" filter="url(#fw-glow)">
          <g transform={`rotate(${wheelDeg})`}>
            <circle r={R + 4} fill="none" stroke="url(#fw-rim)" strokeWidth="5" opacity="0.55" />
            <circle r={R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />

            {cabinAngles.map((deg) => (
              <line
                key={`spoke-${deg}`}
                x1="0"
                y1="0"
                x2="0"
                y2={-R}
                stroke="url(#fw-spoke)"
                strokeWidth="3.2"
                strokeLinecap="round"
                transform={`rotate(${deg})`}
              />
            ))}

            <circle r="14" fill="url(#fw-hub)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />

            {cabinAngles.map((phi) => (
              <g key={`cab-${phi}`} transform={`rotate(${phi}) translate(0 ${-R})`}>
                {/* Undo wheel + spoke rotation so +Y stays screen-down (gravity) */}
                <g transform={`rotate(${-(wheelDeg + phi)})`}>
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={CABLE_LEN}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <g transform={`translate(0 ${CABLE_LEN})`}>
                    <rect
                      x="-10"
                      y="0"
                      width="20"
                      height="26"
                      rx="6"
                      fill="rgba(15,22,41,0.9)"
                      stroke="rgba(255,255,255,0.38)"
                      strokeWidth="1"
                    />
                    <rect x="-6" y="5" width="5" height="5" rx="1" fill="rgba(34,211,238,0.5)" />
                    <rect x="1" y="5" width="5" height="5" rx="1" fill="rgba(244,114,182,0.45)" />
                    <rect x="-6" y="14" width="5" height="5" rx="1" fill="rgba(167,139,250,0.35)" />
                    <rect x="1" y="14" width="5" height="5" rx="1" fill="rgba(34,211,238,0.35)" />
                  </g>
                </g>
              </g>
            ))}
          </g>
        </g>

        <g fill="rgba(250,204,21,0.55)" opacity="0.7">
          <circle cx="180" cy="120" r="2">
            <animate attributeName="opacity" values="0.35;0.95;0.35" dur="3.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="1020" cy="160" r="2">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="4.1s" repeatCount="indefinite" begin="0.8s" />
          </circle>
          <circle cx="420" cy="90" r="1.5">
            <animate attributeName="opacity" values="0.3;0.85;0.3" dur="2.7s" repeatCount="indefinite" begin="0.3s" />
          </circle>
        </g>
      </svg>
    </div>
  );
}
