import React from "react";

interface MoonPhaseSvgProps {
  illumination: number; // 0 to 1
  phaseName: string;
  phaseLongitude: number; // 0 to 360: waxing/waning phase, not angular separation
  altitude: number; // degrees
  filterMode?: "natural" | "amber" | "infrared" | "chrono";
}

export const MoonPhaseSvg: React.FC<MoonPhaseSvgProps> = ({
  illumination,
  phaseName,
  phaseLongitude,
  altitude,
  filterMode = "natural",
}) => {
  const k = Math.max(0, Math.min(1, illumination));
  const isWaxing = phaseLongitude < 180;
  const rx = 45 * Math.abs(2 * k - 1);

  let litPath = "";
  if (k > 0.003) {
    if (isWaxing) {
      // Lit portion on the right side
      const outerArc = "M 50 5 A 45 45 0 0 1 50 95";
      const innerArc = k < 0.5
        ? `A ${rx} 45 0 0 0 50 5` // crescent: curves left
        : `A ${rx} 45 0 0 1 50 5`; // gibbous: curves right
      litPath = `${outerArc} ${innerArc} Z`;
    } else {
      // Lit portion on the left side
      const outerArc = "M 50 5 A 45 45 0 0 0 50 95";
      const innerArc = k < 0.5
        ? `A ${rx} 45 0 0 1 50 5` // crescent: curves right
        : `A ${rx} 45 0 0 0 50 5`; // gibbous: curves left
      litPath = `${outerArc} ${innerArc} Z`;
    }
  }

  // Illustrative tilt; this renderer does not model the observer's limb position angle.
  const tiltAngle = Math.sin((phaseLongitude - 90) * (Math.PI / 180)) * 24;

  return (
    <div className="relative w-full max-w-64 h-64 mx-auto flex flex-col items-center justify-center select-none">
      {/* Ambient Celestial Glow */}
      <div 
        className={`absolute w-52 h-52 rounded-full transition-all duration-700 blur-3xl pointer-events-none ${
          filterMode === "infrared" ? "bg-rose-500/15" :
          filterMode === "amber" ? "bg-amber-500/20" :
          filterMode === "chrono" ? "bg-emerald-500/15" :
          "bg-blue-400/15"
        }`} 
      />

      {/* Main SVG Moon Sphere */}
      <svg
        id="moon-sphere-svg"
        viewBox="0 0 100 100"
        className="w-52 h-52 drop-shadow-[0_0_25px_rgba(255,255,255,0.12)] transition-transform duration-700 ease-out"
        style={{ transform: `rotate(${tiltAngle}deg)` }}
      >
        <defs>
          {/* Lit Crescent Glow */}
          <linearGradient id="silverGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor={filterMode === "amber" ? "#FDE68A" : "#F8FAFC"} />
            <stop offset="100%" stopColor={filterMode === "amber" ? "#F59E0B" : filterMode === "infrared" ? "#F87171" : "#E2E8F0"} />
          </linearGradient>

          {/* Earthshine & Lunar Night Side Gradient */}
          <radialGradient id="shadowSphere" cx="42%" cy="42%" r="58%">
            <stop offset="0%" stopColor="#1E2738" />
            <stop offset="60%" stopColor="#111827" />
            <stop offset="90%" stopColor="#0B0F19" />
            <stop offset="100%" stopColor="#030712" />
          </radialGradient>

          {/* Soft Lunar Basalt Seas (Mare Imbrium, Mare Serenitatis, etc.) */}
          <radialGradient id="mare1" cx="35%" cy="35%" r="20%">
            <stop offset="0%" stopColor="#0A0E1A" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="mare2" cx="60%" cy="40%" r="22%">
            <stop offset="0%" stopColor="#0A0E1A" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="mare3" cx="45%" cy="65%" r="25%">
            <stop offset="0%" stopColor="#0A0E1A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0" />
          </radialGradient>

          {/* Lunar Rim Horizon Stroke Gradient */}
          <linearGradient id="limbGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0.1" />
          </linearGradient>

          <clipPath id="moonCircleClip">
            <circle cx="50" cy="50" r="45" />
          </clipPath>
          
          <clipPath id="litPathClip">
            <path d={litPath || "M 0 0"} />
          </clipPath>
        </defs>

        {/* 1. Base Dark Moon Sphere (Night Side with subtle Earthshine) */}
        <circle cx="50" cy="50" r="45" fill="url(#shadowSphere)" />
        
        {/* Mare (Dark basalt plains) on the unlit face */}
        <g clipPath="url(#moonCircleClip)">
          <circle cx="36" cy="36" r="14" fill="url(#mare1)" />
          <circle cx="62" cy="38" r="15" fill="url(#mare2)" />
          <circle cx="48" cy="62" r="18" fill="url(#mare3)" />
          
          {/* Subtle micro craters on dark hemisphere */}
          <circle cx="28" cy="58" r="2.5" fill="#000000" fillOpacity="0.25" stroke="#FFFFFF" strokeWidth="0.3" strokeOpacity="0.08" />
          <circle cx="65" cy="62" r="3.5" fill="#000000" fillOpacity="0.2" stroke="#FFFFFF" strokeWidth="0.3" strokeOpacity="0.08" />
          <circle cx="45" cy="22" r="2" fill="#000000" fillOpacity="0.3" stroke="#FFFFFF" strokeWidth="0.3" strokeOpacity="0.06" />
        </g>

        {/* Subtle Lunar Limb Rim */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="url(#limbGlow)" strokeWidth="0.6" />

        {/* 2. Lit Crescent Portion */}
        {litPath && (
          <path
            id="moon-lit-path"
            d={litPath}
            fill="url(#silverGlow)"
            filter="drop-shadow(0 0 4px rgba(255,255,255,0.45))"
          />
        )}

        {/* 3. Surface details inside the lit crescent boundary */}
        {litPath && (
          <g clipPath="url(#litPathClip)">
            {/* Crater shadows to give true organic depth to the illuminated terrain */}
            <circle cx="48" cy="28" r="5" fill="#000000" fillOpacity="0.08" />
            <circle cx="48.3" cy="28.3" r="4.7" fill="#FFFFFF" fillOpacity="0.25" />

            <circle cx="36" cy="52" r="7" fill="#000000" fillOpacity="0.07" />
            <circle cx="36.4" cy="52.4" r="6.6" fill="#FFFFFF" fillOpacity="0.2" />

            <circle cx="68" cy="42" r="4.5" fill="#000000" fillOpacity="0.09" />
            <circle cx="68.2" cy="42.2" r="4.2" fill="#FFFFFF" fillOpacity="0.3" />

            <circle cx="54" cy="70" r="6" fill="#000000" fillOpacity="0.08" />
            <circle cx="54.3" cy="70.3" r="5.6" fill="#FFFFFF" fillOpacity="0.22" />
          </g>
        )}
      </svg>

      {/* Tilt Angle & Altitude Indicator */}
      <div className="absolute -bottom-1 flex items-center gap-2 text-[10px] font-mono tracking-wider text-slate-400">
        <span>TILT {tiltAngle > 0 ? `+${tiltAngle.toFixed(1)}°` : `${tiltAngle.toFixed(1)}°`}</span>
        <span className="text-slate-600">·</span>
        <span className={altitude > 0 ? "text-emerald-400 font-medium" : "text-slate-500"}>
          {altitude > 0 ? `+${altitude.toFixed(1)}° ABOVE HORIZON` : `${altitude.toFixed(1)}° BELOW HORIZON`}
        </span>
      </div>
    </div>
  );
};
