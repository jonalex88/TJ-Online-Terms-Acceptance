import tjLogo from "@/assets/tj-logo.png";

const NotDroids = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.25),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(129,140,248,0.2),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,0.18),transparent_45%)]" />
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <main className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl w-full rounded-3xl border border-sky-400/30 bg-slate-900/70 backdrop-blur-md shadow-[0_0_80px_rgba(14,165,233,0.18)] p-8 md:p-10 text-center">
          <div className="mx-auto relative w-64 h-64 md:w-72 md:h-72">
            <div className="absolute inset-0 rounded-full bg-sky-500/15 blur-2xl" />
            <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-[0_0_24px_rgba(34,211,238,0.45)]" role="img" aria-label="TJ logo in a Jedi outfit">
              <defs>
                <linearGradient id="robe" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <linearGradient id="hood" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>

              <path d="M70 270 C90 200, 230 200, 250 270 L250 286 L70 286 Z" fill="url(#robe)" />
              <path d="M108 110 C128 72, 192 72, 212 110 L226 170 C206 150, 114 150, 94 170 Z" fill="url(#hood)" />
              <circle cx="160" cy="142" r="56" fill="#0b1220" stroke="#475569" strokeWidth="4" />

              <foreignObject x="112" y="94" width="96" height="96">
                <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: "96px", height: "96px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={tjLogo} alt="TJ logo" style={{ width: "86px", filter: "brightness(0) invert(1)" }} />
                </div>
              </foreignObject>

              <rect x="214" y="244" width="72" height="10" rx="5" fill="#94a3b8" />
              <rect x="286" y="245" width="18" height="8" rx="4" fill="#cbd5e1" />
              <rect x="230" y="226" width="12" height="36" rx="6" fill="#334155" />
              <rect x="302" y="241" width="10" height="14" rx="5" fill="#22d3ee" />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl md:text-4xl font-semibold tracking-tight text-sky-200">
            These are not the droids you are looking for
          </h1>
        </div>
      </main>
    </div>
  );
};

export default NotDroids;
