(() => {
  const APP = document.body?.querySelector(".brand span")?.textContent === "Teacher" ? "teacher" : "admin";
  const DB_NAME = "skulgo-safe-data";
  const DB_VERSION = 1;
  const STORE = "snapshots";
  const VERSION_KEY = "skulgo.app.version.v1";
  const BANNER_ID = "skulgo-update-banner";

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function snapshot() {
    try {
      const data = {};
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key) data[key] = localStorage.getItem(key);
      }
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put({
          app: APP,
          savedAt: new Date().toISOString(),
          data
        }, APP);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch (error) {
      console.warn("SkulGo safety snapshot unavailable.", error);
    }
  }

  async function readVersion() {
    try {
      const response = await fetch("./version.json?ts=" + Date.now(), {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  function showUpdate(version) {
    if (document.getElementById(BANNER_ID)) return;
    const banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.style.cssText = "position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;padding:12px 16px;border:1px solid #b7d9c7;border-radius:10px;background:#f3fbf6;color:#123b29;box-shadow:0 6px 24px rgba(0,0,0,.12);font:14px/1.4 Arial,sans-serif;display:flex;gap:12px;align-items:center;justify-content:space-between";
    banner.innerHTML = '<span><strong>SkulGo update available.</strong> Your school data is kept separately from the app update.</span><button type="button" style="border:0;border-radius:7px;padding:8px 12px;background:#116b42;color:#fff;cursor:pointer">Update</button>';
    banner.querySelector("button").onclick = async () => {
      await snapshot();
      try { localStorage.setItem(VERSION_KEY, version.version); } catch {}
      if (navigator.serviceWorker?.controller) {
        try { await navigator.serviceWorker.getRegistration().then(r => r?.update()); } catch {}
      }
      location.reload();
    };
    document.body.appendChild(banner);
  }

  async function checkVersion() {
    const remote = await readVersion();
    if (!remote?.version) return;
    const current = localStorage.getItem(VERSION_KEY);
    if (!current) {
      localStorage.setItem(VERSION_KEY, remote.version);
      return;
    }
    if (current !== remote.version) showUpdate(remote.version);
  }

  window.skulgoSafeSnapshot = snapshot;
  snapshot();
  setInterval(snapshot, 30000);
  window.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") snapshot(); });
  window.addEventListener("beforeunload", () => { snapshot(); });
  checkVersion();
  setInterval(checkVersion, 300000);
})();