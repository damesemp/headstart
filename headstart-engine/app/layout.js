import "./globals.css";
import { BrandBar, SiteFooter } from "./components/SiteChrome";

export const metadata = {
  title: "Astute Headstart",
  description: "Astute Headstart Applications Engine",
};

// Round 5 — the chrome lives here, not in EngineShell, so the brand bar and
// footer frame every state including loading, error and the splash screen.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div className="hs-frame">
          <BrandBar />
          <div className="hs-divider" />
          <div className="hs-frame-body">{children}</div>
          <div className="hs-divider" />
          <SiteFooter build={process.env.NEXT_PUBLIC_BUILD_ID || null} />
        </div>
      </body>
    </html>
  );
}
