import { useEffect, useState } from 'react';

export default function IntroAnimation() {
  const [show, setShow] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem('introShown');
    if (shown) { setShow(false); return; }
    const t1 = setTimeout(() => setExiting(true), 4500);
    const t2 = setTimeout(() => {
      sessionStorage.setItem('introShown', '1');
      setShow(false);
    }, 5700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!show) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;600;800&display=swap');

        .iv-root {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          background: radial-gradient(circle at center, #FFFFFF 0%, #F0F7FF 50%, #E6F3FF 100%);
          overflow: hidden; opacity: 1;
          transition: opacity 1.2s ease-in-out;
        }
        .iv-root.exit { opacity: 0; pointer-events: none; }

        /* Blue dust particles */
        .iv-p {
          position: absolute; bottom: -6px; border-radius: 50%;
          animation: ivFloat linear infinite;
        }
        @keyframes ivFloat {
          0%   { transform: translateY(0) scale(0.5); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(-105vh) scale(1.2); opacity: 0; }
        }

        /* Vibration rings — blue + teal alternating */
        .iv-ring {
          position: absolute; border-radius: 50%;
          animation: ivRing 2.8s ease-in-out infinite;
        }
        .iv-ring-bl { border: 1.5px solid rgba(46,163,242,0.30); }
        .iv-ring-tl { border: 1.5px solid rgba(43,191,156,0.25); }
        @keyframes ivRing {
          0%,100% { transform: scale(1);    opacity: 0.5; }
          50%      { transform: scale(1.06); opacity: 1; }
        }

        /* SVG wrapper */
        .iv-svg-wrap {
          position: relative; display: flex;
          align-items: center; justify-content: center;
          animation: ivWrapIn 0.5s ease-out forwards;
        }
        @keyframes ivWrapIn {
          from { opacity: 0; transform: scale(0.9) translateY(16px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }

        /* Stroke draw */
        .stroke { fill: none; stroke-linecap: round; stroke-width: 10; }

        .iv-left {
          stroke: url(#ivGLeft);
          stroke-dasharray: 125; stroke-dashoffset: 125;
          filter: url(#ivGlow);
          animation: draw 1s ease-in-out 0.2s forwards;
        }
        .iv-right {
          stroke: url(#ivGRight);
          stroke-dasharray: 125; stroke-dashoffset: 125;
          filter: url(#ivGlow);
          animation: draw 1s ease-in-out 0.5s forwards;
        }
        .iv-cross {
          stroke: url(#ivGCross);
          stroke-dasharray: 80; stroke-dashoffset: 80;
          filter: url(#ivGlow);
          animation: draw 1s ease-in-out 1.1s forwards;
        }
        @keyframes draw { to { stroke-dashoffset: 0; } }

        /* Glow pulse */
        .iv-svg {
          overflow: visible;
          animation: ivGlowPulse 1.8s ease-in-out 2.2s infinite alternate;
        }
        @keyframes ivGlowPulse {
          from { filter: drop-shadow(0 0 6px  rgba(46,163,242,0.5)) drop-shadow(0 0 12px rgba(43,191,156,0.3)); }
          to   { filter: drop-shadow(0 0 22px rgba(46,163,242,0.9)) drop-shadow(0 0 40px rgba(43,191,156,0.6)); }
        }

        /* Scan line */
        .iv-scan {
          position: absolute; width: 100%; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(43,191,156,0.9), transparent);
          animation: ivScan 1.1s ease-in-out 0.1s forwards; opacity: 0;
        }
        @keyframes ivScan {
          0%   { top: 0%;   opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        /* Text */
        .iv-name {
          margin-top: 32px;
          font-family: 'Montserrat', sans-serif;
          font-size: 18px; font-weight: 800;
          letter-spacing: 0.45em; text-transform: uppercase;
          background: linear-gradient(135deg, #1F4E79 0%, #2EA3F2 50%, #1F4E79 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          opacity: 0;
          animation: ivTextIn 0.8s ease 2.3s forwards, shimmerText 3s linear 3s infinite;
        }
        @keyframes shimmerText {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        .iv-sub {
          margin-top: 8px;
          font-family: 'Montserrat', sans-serif;
          font-size: 10px; font-weight: 400;
          letter-spacing: 0.5em; text-transform: uppercase;
          color: #1F4E79;
          opacity: 0;
          animation: ivTextIn 0.8s ease 2.7s forwards;
        }
        @keyframes ivTextIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Divider */
        .iv-divider {
          display: flex; align-items: center; gap: 10px;
          margin-top: 18px; opacity: 0;
          animation: ivTextIn 0.5s ease 3.1s forwards;
        }
        .iv-dline {
          height: 1px; width: 0;
          background: linear-gradient(90deg, transparent, rgba(43,191,156,0.8));
          animation: ivLine 0.8s ease 3.2s forwards;
        }
        .iv-dline.r { background: linear-gradient(90deg, rgba(43,191,156,0.8), transparent); }
        @keyframes ivLine { to { width: 60px; } }
        .iv-ddot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #2BBF9C;
          box-shadow: 0 0 8px rgba(43,191,156,0.9);
        }

        /* Progress bar */
        .iv-bar {
          position: absolute; bottom: 0; left: 0;
          height: 2px; width: 0;
          background: linear-gradient(90deg, #2EA3F2, #2BBF9C, #2EA3F2);
          box-shadow: 0 0 10px rgba(43,191,156,0.7);
          animation: ivBar 4.3s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes ivBar { to { width: 100%; } }
      `}</style>

      <div className={`iv-root${exiting ? ' exit' : ''}`}>

        {/* Blue + teal particles */}
        {[
          { l:'8%',  s:'3px', d:'9s',  dl:'0s',   c:'rgba(43,191,156,0.6)'  },
          { l:'20%', s:'2px', d:'12s', dl:'1.2s',  c:'rgba(46,163,242,0.7)'  },
          { l:'35%', s:'4px', d:'8s',  dl:'0.4s',  c:'rgba(43,191,156,0.5)' },
          { l:'50%', s:'2px', d:'11s', dl:'2s',    c:'rgba(43,191,156,0.6)' },
          { l:'63%', s:'3px', d:'10s', dl:'0.8s',  c:'rgba(43,191,156,0.7)' },
          { l:'75%', s:'2px', d:'13s', dl:'1.8s',  c:'rgba(46,163,242,0.5)'  },
          { l:'88%', s:'3px', d:'7s',  dl:'0.2s',  c:'rgba(46,163,242,0.6)'},
        ].map((p, i) => (
          <div key={i} className="iv-p" style={{
            left: p.l, width: p.s, height: p.s,
            background: p.c,
            animationDuration: p.d, animationDelay: p.dl,
          }} />
        ))}

        {/* Vibration rings — alternating blue & teal */}
        <div className="iv-ring iv-ring-bl" style={{ width: 260, height: 260, animationDelay: '0s' }} />
        <div className="iv-ring iv-ring-tl" style={{ width: 340, height: 340, animationDelay: '0.5s' }} />
        <div className="iv-ring iv-ring-bl" style={{ width: 420, height: 420, animationDelay: '1.0s' }} />
        <div className="iv-ring iv-ring-tl" style={{ width: 500, height: 500, animationDelay: '1.5s' }} />

        {/* H Logo */}
        <div className="iv-svg-wrap">
          <div className="iv-scan" />

          <svg
            className="iv-svg"
            viewBox="0 0 120 140"
            width="160" height="186"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="ivGLeft" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stopColor="#2EA3F2" />
                <stop offset="50%"  stopColor="#2BBF9C" />
                <stop offset="100%" stopColor="#2EA3F2" />
              </linearGradient>
              <linearGradient id="ivGRight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stopColor="#2EA3F2" />
                <stop offset="50%"  stopColor="#2BBF9C" />
                <stop offset="100%" stopColor="#2EA3F2" />
              </linearGradient>
              <linearGradient id="ivGCross" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#2EA3F2" />
                <stop offset="50%"  stopColor="#EAF4FF" />
                <stop offset="100%" stopColor="#2EA3F2" />
              </linearGradient>
              <filter id="ivGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <line className="stroke iv-left"  x1="22" y1="10" x2="22" y2="130" />
            <line className="stroke iv-right" x1="98" y1="10" x2="98" y2="130" />
            <line className="stroke iv-cross" x1="22" y1="70" x2="98" y2="70" />
          </svg>
        </div>

        <p className="iv-name">Haveda Hospital</p>
        <p className="iv-sub">Healthcare &nbsp;·&nbsp; Excellence &nbsp;·&nbsp; Care</p>

        <div className="iv-divider">
          <div className="iv-dline" />
          <div className="iv-ddot" />
          <div className="iv-dline r" />
        </div>

        <div className="iv-bar" />
      </div>
    </>
  );
}
