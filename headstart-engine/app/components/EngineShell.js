"use client";

import { useEffect, useState } from "react";
import Flyout from "./Flyout";
import SplashScreen from "./SplashScreen";
import HotspotMap from "./HotspotMap";
import EmbeddedPCMap from "./EmbeddedPCMap";
import VideoModal from "./VideoModal";
import {
  ROBOTICS_AUTOMATION_IMAGE_SRC,
  SMART_WATCH_IMAGE_SRC,
  SMART_RING_IMAGE_SRC,
  SMART_GLASSES_IMAGE_SRC,
  COMBAT_DRONE_IMAGE_SRC,
  SURVEILLANCE_DRONE_IMAGE_SRC,
} from "../lib/deviceImages";

const WEARABLES_IMAGES = {
  "Smart Watch": SMART_WATCH_IMAGE_SRC,
  "Smart Ring": SMART_RING_IMAGE_SRC,
  "Smart Glasses": SMART_GLASSES_IMAGE_SRC,
};

const MILITARY_DRONES_IMAGES = {
  "Combat Drone": COMBAT_DRONE_IMAGE_SRC,
  "Surveillance Drone": SURVEILLANCE_DRONE_IMAGE_SRC,
};

const SPLASH_SESSION_KEY = "hs_splash_seen";

// Application-map views this shell knows how to render, keyed the same way
// as segmentAppMap.js's view keys. Embedded PC has no image/hotspots — it's
// the standalone exception.
const APP_TITLES = {
  wearables: "Wearables",
  "military-drones": "Military Drones - Air",
  "robotics-automation": "Robotics & Automation",
  "embedded-pc": "Embedded PC",
};

// Single-page shell for the four application maps. The reference-data fetch
// happens once here and is passed down, instead of every view fetching it
// separately.
export default function EngineShell() {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [view, setView] = useState("embedded-pc");
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [pendingHotspotId, setPendingHotspotId] = useState(null);
  const [pendingVariant, setPendingVariant] = useState(null);
  const [urlHotspotId, setUrlHotspotId] = useState(null);
  const [urlVariant, setUrlVariant] = useState(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [splashDismissed, setSplashDismissed] = useState(true); // avoid a flash before the session check runs

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reference-data")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
        return json;
      })
      .then((json) => {
        if (!cancelled) setState({ status: "ready", data: json, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: "error", data: null, error: String(err.message || err) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Splash shows once per browser session, then straight to last state on
  // return within that session. Also restores ?app=&hotspot= from the URL
  // so old-route redirects and shared links land on the right view.
  useEffect(() => {
    const seen = sessionStorage.getItem(SPLASH_SESSION_KEY) === "1";
    setSplashDismissed(seen);

    const params = new URLSearchParams(window.location.search);
    const app = params.get("app");
    const hotspot = params.get("hotspot");
    const variant = params.get("variant");
    if (app && APP_TITLES[app]) {
      setView(app);
      if (hotspot) {
        setPendingHotspotId(hotspot);
        setUrlHotspotId(hotspot);
      }
      if (variant) {
        setPendingVariant(variant);
        setUrlVariant(variant);
      }
    }
  }, []);

  function dismissSplash() {
    sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
    setSplashDismissed(true);
  }

  // Keep the URL in sync (query params on the one page, not separate
  // routes) so the current view is shareable/bookmarkable.
  useEffect(() => {
    const params = new URLSearchParams();
    if (view !== "embedded-pc" || urlHotspotId || urlVariant) {
      params.set("app", view);
      if (urlHotspotId) params.set("hotspot", urlHotspotId);
      if (urlVariant) params.set("variant", urlVariant);
    }
    const qs = params.toString();
    const url = qs ? `/?${qs}` : "/";
    window.history.replaceState(null, "", url);
  }, [view, urlHotspotId, urlVariant]);

  function handleFlyoutGo({ view: viewKey, hotspotId, variant, keepOpen = false }) {
    setView(viewKey);
    setPendingHotspotId(hotspotId || null);
    setPendingVariant(variant || null);
    setUrlHotspotId(hotspotId || null);
    setUrlVariant(variant || null);
    setSelectedManufacturer(null);
    setActiveVideo(null);
    if (!keepOpen) setFlyoutOpen(false);
  }

  function handleFlyoutManufacturer(manufacturer) {
    setView("embedded-pc");
    setPendingHotspotId(null);
    setPendingVariant(null);
    setUrlHotspotId(null);
    setUrlVariant(null);
    setSelectedManufacturer(manufacturer);
    setFlyoutOpen(false);
  }

  function resetAll() {
    setView("embedded-pc");
    setPendingHotspotId(null);
    setPendingVariant(null);
    setUrlHotspotId(null);
    setUrlVariant(null);
    setSelectedManufacturer(null);
    setFlyoutOpen(false);
    setResetSignal((signal) => signal + 1);
    window.history.replaceState(null, "", "/");
  }

  if (state.status === "loading") {
    return <div className="hs-state-msg">Loading Headstart…</div>;
  }
  if (state.status === "error") {
    return <div className="hs-state-msg">Could not load live data from Airtable: {state.error}</div>;
  }

  if (!splashDismissed) {
    return <SplashScreen onContinue={dismissSplash} />;
  }

  return (
    <div className="hs-app-shell">
      <aside className="hs-rail">
        <div className="hs-rail-logo" aria-hidden="true">
          A
        </div>
        <button
          type="button"
          className="hs-rail-btn"
          title="Menu"
          aria-label="Open navigation"
          onClick={() => setFlyoutOpen((o) => !o)}
        >
          ☰
        </button>
        <button
          type="button"
          className="hs-rail-btn"
          title="Reset selection"
          aria-label="Reset selection"
          onClick={resetAll}
        >
          ↺
        </button>
      </aside>

      <Flyout
        open={flyoutOpen}
        onClose={() => setFlyoutOpen(false)}
        data={state.data}
        onGo={handleFlyoutGo}
        onSelectManufacturer={handleFlyoutManufacturer}
        onWatchVideo={setActiveVideo}
        resetSignal={resetSignal}
      />

      {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}

      <div className="hs-main">
        {view === "embedded-pc" ? (
          <EmbeddedPCMap
            data={state.data}
            selectedManufacturer={selectedManufacturer}
            onSelectManufacturer={setSelectedManufacturer}
            resetSignal={resetSignal}
          />
        ) : (
          <HotspotMap
            data={state.data}
            applicationModel={APP_TITLES[view]}
            imageSrc={view === "robotics-automation" ? ROBOTICS_AUTOMATION_IMAGE_SRC : undefined}
            variantImages={
              view === "wearables"
                ? WEARABLES_IMAGES
                : view === "military-drones"
                ? MILITARY_DRONES_IMAGES
                : undefined
            }
            pendingHotspotId={pendingHotspotId}
            pendingVariant={pendingVariant}
            onConsumedPending={() => {
              setPendingHotspotId(null);
              setPendingVariant(null);
            }}
            onHotspotSelectionChange={setUrlHotspotId}
            onVariantSelectionChange={setUrlVariant}
            resetSignal={resetSignal}
          />
        )}
      </div>
    </div>
  );
}
