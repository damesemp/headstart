"use client";

// Start screen — shown once per browser session (EngineShell gates this via
// sessionStorage), matching the reference screenshot: ASTUTE / HEADSTART
// wordmark with a single CONTINUE action into the app.
export default function SplashScreen({ onContinue }) {
  return (
    <div className="hs-splash">
      <div className="hs-splash-card">
        <div className="hs-splash-astute">ASTUTE</div>
        <div className="hs-splash-headstart">HEADSTART</div>
        <div className="hs-splash-sub">Applications Engine</div>
        <button type="button" className="hs-splash-continue" onClick={onContinue}>
          CONTINUE
        </button>
      </div>
    </div>
  );
}
