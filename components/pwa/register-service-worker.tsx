"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        const manifestHref =
          document
            .querySelector('link[rel="manifest"]')
            ?.getAttribute("href") ?? "./manifest.webmanifest";
        const manifestUrl = new URL(manifestHref, window.location.href);
        const serviceWorkerUrl = new URL("sw.js", manifestUrl);
        const scopeUrl = new URL(".", serviceWorkerUrl);

        await navigator.serviceWorker.register(serviceWorkerUrl, {
          scope: scopeUrl.pathname
        });
      } catch {
        // Ignore registration failures in unsupported environments.
      }
    };

    if (document.readyState === "complete") {
      void register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => {
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
