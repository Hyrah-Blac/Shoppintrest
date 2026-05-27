export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden relative">

      {/* Deep ambient background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,_#0d1117_0%,_#000000_100%)]" />

      {/* Soft distant glow pools */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-indigo-500/8 blur-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '4s' }} />

      {/* Loader container */}
      <div className="relative flex items-center justify-center z-10">

        {/* === Outer rotating glass ring === */}
        <div
          className="absolute w-[140px] h-[140px] rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.03) 20%, rgba(180,200,255,0.18) 50%, rgba(255,255,255,0.03) 80%, transparent 100%)',
            animation: 'spinSlow 6s linear infinite',
          }}
        />

        {/* === Mid glass ring (counter-rotate) === */}
        <div
          className="absolute w-[112px] h-[112px] rounded-full"
          style={{
            background: 'conic-gradient(from 180deg, transparent 0%, rgba(100,160,255,0.10) 30%, rgba(200,220,255,0.22) 55%, rgba(100,160,255,0.10) 80%, transparent 100%)',
            animation: 'spinSlow 9s linear infinite reverse',
          }}
        />

        {/* === Glass capsule body === */}
        <div
          className="relative w-[88px] h-[88px] rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(100,160,255,0.07)',
          }}
        >
          {/* Specular highlight */}
          <div
            className="absolute top-[10px] left-[14px] w-[34px] h-[14px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(255,255,255,0.28) 0%, transparent 100%)',
              filter: 'blur(3px)',
            }}
          />

          {/* Inner pulsing core */}
          <div
            className="w-[22px] h-[22px] rounded-full"
            style={{
              background: 'radial-gradient(circle at 40% 35%, rgba(180,210,255,0.9), rgba(100,160,255,0.5) 60%, rgba(60,120,255,0.2))',
              boxShadow: '0 0 20px rgba(120,170,255,0.5), 0 0 40px rgba(80,140,255,0.25)',
              animation: 'corePulse 2.8s ease-in-out infinite',
            }}
          />
        </div>

        {/* === Outermost diffuse halo === */}
        <div
          className="absolute w-[160px] h-[160px] rounded-full"
          style={{
            background: 'radial-gradient(circle, transparent 44%, rgba(120,170,255,0.06) 60%, transparent 75%)',
            animation: 'haloPulse 3.6s ease-in-out infinite',
          }}
        />
      </div>

      {/* Keyframe definitions */}
      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes corePulse {
          0%, 100% { opacity: 0.7; transform: scale(0.88); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes haloPulse {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50%       { opacity: 1;   transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}