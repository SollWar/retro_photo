"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type FilterDefinition = {
  id: string;
  name: string;
  description: string;
  filter: string;
  tone: [number, number, number];
  lightLeak: string;
  dateTint: string;
  vignette: number;
  grain: number;
};

type CaptureSettings = {
  filterId: string;
  grainBoost: number;
  vignetteBoost: number;
  showTimestamp: boolean;
};

type TiltState = {
  beta: number;
  gamma: number;
  angle: number;
};

const FILTERS: FilterDefinition[] = [
  {
    id: "sunset-superia",
    name: "SCENE FILE",
    description: "Теплая пленка с янтарными тенями.",
    filter: "sepia(0.42) saturate(1.45) contrast(1.22) brightness(1.04) hue-rotate(-10deg)",
    tone: [255, 166, 85],
    lightLeak: "from-orange-400/28 via-amber-200/12 to-transparent",
    dateTint: "#ffd28c",
    vignette: 0.3,
    grain: 0.18
  },
  {
    id: "neon-vhs",
    name: "CAMERA SETUP",
    description: "Холодный VHS с яркими бликами.",
    filter: "contrast(1.28) saturate(1.5) brightness(0.96) hue-rotate(14deg)",
    tone: [74, 214, 201],
    lightLeak: "from-fuchsia-500/22 via-cyan-300/10 to-transparent",
    dateTint: "#92fff4",
    vignette: 0.4,
    grain: 0.24
  },
  {
    id: "mono-noir",
    name: "DISPLAY SETUP",
    description: "Жесткий монохромный режим.",
    filter: "grayscale(1) contrast(1.4) brightness(0.92)",
    tone: [240, 240, 240],
    lightLeak: "from-white/12 via-transparent to-black/20",
    dateTint: "#f5f5f5",
    vignette: 0.46,
    grain: 0.22
  },
  {
    id: "polaroid-dream",
    name: "OTHER FUNCTIONS",
    description: "Мягкий выцветший полароид.",
    filter: "sepia(0.22) saturate(1.1) contrast(0.9) brightness(1.12)",
    tone: [255, 214, 180],
    lightLeak: "from-rose-200/24 via-amber-100/15 to-transparent",
    dateTint: "#fff0d8",
    vignette: 0.2,
    grain: 0.14
  }
];

const defaultSettings: CaptureSettings = {
  filterId: FILTERS[0].id,
  grainBoost: 0.8,
  vignetteBoost: 0.72,
  showTimestamp: true
};

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getScreenAngle() {
  if (typeof window === "undefined") {
    return 0;
  }

  const orientation = window.screen.orientation;
  if (orientation && typeof orientation.angle === "number") {
    return orientation.angle;
  }

  return typeof window.orientation === "number" ? window.orientation : 0;
}

export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const [settings, setSettings] = useState<CaptureSettings>(defaultSettings);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCaptureUrl, setLastCaptureUrl] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tilt, setTilt] = useState<TiltState>({ beta: 0, gamma: 0, angle: 0 });

  const activeFilter = useMemo(
    () => FILTERS.find((filter) => filter.id === settings.filterId) ?? FILTERS[0],
    [settings.filterId]
  );

  const viewOffsetX = clamp(tilt.gamma * 0.18, -8, 8);
  const viewOffsetY = clamp(tilt.beta * 0.12, -8, 8);
  const tiltRotate = clamp(tilt.gamma * 0.12, -4, 4);
  const dateAngle = clamp(tilt.gamma * 0.35 + tilt.beta * 0.08 + tilt.angle, -35, 35);

  useEffect(() => {
    return () => {
      if (lastCaptureUrl) {
        URL.revokeObjectURL(lastCaptureUrl);
      }
      stopMediaStream(activeStreamRef.current);
    };
  }, [lastCaptureUrl]);

  useEffect(() => {
    async function bootstrapCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Браузер не поддерживает доступ к камере.");
        setIsStarting(false);
        return;
      }

      setIsStarting(true);
      setError(null);

      try {
        const initialStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        activeStreamRef.current = initialStream;
        if (videoRef.current) {
          videoRef.current.srcObject = initialStream;
        }

        const availableDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = availableDevices.filter((device) => device.kind === "videoinput");
        setDevices(videoInputs);

        const initialTrack = initialStream.getVideoTracks()[0];
        const currentDeviceId = initialTrack.getSettings().deviceId;
        setActiveDeviceId(currentDeviceId ?? videoInputs[0]?.deviceId ?? null);
        setIsReady(true);
      } catch {
        setError("Не удалось получить доступ к камере. Проверьте разрешения браузера.");
      } finally {
        setIsStarting(false);
      }
    }

    void bootstrapCamera();
  }, []);

  useEffect(() => {
    const handleDeviceChange = async () => {
      try {
        const availableDevices = await navigator.mediaDevices.enumerateDevices();
        setDevices(availableDevices.filter((device) => device.kind === "videoinput"));
      } catch {
        // Ignore enumerateDevices errors after permissions change.
      }
    };

    navigator.mediaDevices?.addEventListener?.("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", handleDeviceChange);
    };
  }, []);

  useEffect(() => {
    const applyOrientation = (beta: number, gamma: number) => {
      setTilt({
        beta: clamp(beta || 0, -35, 35),
        gamma: clamp(gamma || 0, -35, 35),
        angle: getScreenAngle()
      });
    };

    const handleOrientation = (event: DeviceOrientationEvent) => {
      applyOrientation(event.beta ?? 0, event.gamma ?? 0);
    };

    const handleScreenChange = () => {
      setTilt((current) => ({
        ...current,
        angle: getScreenAngle()
      }));
    };

    setTilt((current) => ({ ...current, angle: getScreenAngle() }));

    const orientationApi = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };

    if (typeof orientationApi?.requestPermission === "function") {
      const enableByGesture = async () => {
        try {
          const result = await orientationApi.requestPermission?.();
          if (result === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        } catch {
          // Ignore denied motion permission.
        }
        window.removeEventListener("pointerdown", enableByGesture);
      };

      window.addEventListener("pointerdown", enableByGesture, { once: true });
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    window.screen.orientation?.addEventListener?.("change", handleScreenChange);
    window.addEventListener("orientationchange", handleScreenChange);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      window.screen.orientation?.removeEventListener?.("change", handleScreenChange);
      window.removeEventListener("orientationchange", handleScreenChange);
    };
  }, []);

  async function startCamera(deviceId?: string) {
    setError(null);
    setIsStarting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? {
              deviceId: { exact: deviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }
          : {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
        audio: false
      });

      stopMediaStream(activeStreamRef.current);
      activeStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }

      const track = stream.getVideoTracks()[0];
      setActiveDeviceId(track.getSettings().deviceId ?? deviceId ?? null);
      setIsReady(true);
    } catch {
      setError("Не удалось переключить камеру.");
    } finally {
      setIsStarting(false);
    }
  }

  function drawOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    filter: FilterDefinition
  ) {
    const centerX = width / 2;
    const centerY = height / 2;

    const vignette = ctx.createRadialGradient(
      centerX,
      centerY,
      Math.min(width, height) * 0.18,
      centerX,
      centerY,
      Math.max(width, height) * 0.72
    );
    const vignetteStrength = clamp(filter.vignette * settings.vignetteBoost, 0, 0.8);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.65, "rgba(0,0,0,0)");
    vignette.addColorStop(1, `rgba(0,0,0,${vignetteStrength})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    const leak = ctx.createLinearGradient(0, 0, width * 0.7, height);
    leak.addColorStop(0, `rgba(${filter.tone[0]}, ${filter.tone[1]}, ${filter.tone[2]}, 0.34)`);
    leak.addColorStop(0.28, `rgba(${filter.tone[0]}, ${filter.tone[1]}, ${filter.tone[2]}, 0.12)`);
    leak.addColorStop(0.8, "rgba(255,255,255,0)");
    ctx.fillStyle = leak;
    ctx.fillRect(0, 0, width, height);

    const grainOpacity = clamp(filter.grain * settings.grainBoost, 0.06, 0.38);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let index = 0; index < data.length; index += 4) {
      const noise = (Math.random() - 0.5) * 255 * grainOpacity;
      data[index] = clamp(data[index] + noise, 0, 255);
      data[index + 1] = clamp(data[index + 1] + noise, 0, 255);
      data[index + 2] = clamp(data[index + 2] + noise, 0, 255);
    }
    ctx.putImageData(imageData, 0, 0);

    if (settings.showTimestamp) {
      const stamp = new Date().toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit"
      });
      ctx.save();
      ctx.translate(width - 44, height - 38);
      ctx.rotate((dateAngle * Math.PI) / 180);
      ctx.font = `${Math.max(18, width * 0.02)}px monospace`;
      ctx.textAlign = "right";
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = filter.dateTint;
      ctx.fillText(stamp, 0, 0);
      ctx.restore();
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = previewCanvasRef.current;
    const anchor = downloadAnchorRef.current;

    if (!video || !canvas || !anchor || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.filter = activeFilter.filter;
    ctx.drawImage(video, 0, 0, width, height);
    ctx.filter = "none";
    drawOverlay(ctx, width, height, activeFilter);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }

        if (lastCaptureUrl) {
          URL.revokeObjectURL(lastCaptureUrl);
        }

        const objectUrl = URL.createObjectURL(blob);
        setLastCaptureUrl(objectUrl);
        anchor.href = objectUrl;
        anchor.download = `retro-shot-${Date.now()}.jpg`;
        anchor.click();
      },
      "image/jpeg",
      0.95
    );
  }

  const cameraLabel =
    devices.find((device) => device.deviceId === activeDeviceId)?.label || "CAM 1";

  return (
    <main className="min-h-screen bg-black px-0 py-0 text-white">
      <a ref={downloadAnchorRef} className="hidden" />
      <canvas ref={previewCanvasRef} className="hidden" />

      <section className="relative min-h-screen overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          playsInline
          style={{ filter: activeFilter.filter }}
        />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.5)_100%)]" />
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${activeFilter.lightLeak}`} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_20%,transparent_80%,rgba(255,255,255,0.02))]" />

        <div
          className="absolute inset-0 transition-transform duration-200"
          style={{ transform: `translate(${viewOffsetX}px, ${viewOffsetY}px) rotate(${tiltRotate}deg)` }}
        >
          <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white">
            <span className="text-red-500">REC</span>
            <span>{isReady ? "LIVE" : "BOOT"}</span>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.24em] text-white">
            00:00:00:01
          </div>

          <div className="pointer-events-none absolute right-5 top-5 flex flex-col items-end gap-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white">
            <span>AUTO</span>
            <span>AWB</span>
            <span className="mt-1 block h-3 w-8 border border-white">
              <span className="block h-full w-5 bg-white" />
            </span>
          </div>

          <HudCorner className="left-[22%] top-[26%] border-l border-t" />
          <HudCorner className="right-[22%] top-[26%] border-r border-t" />
          <HudCorner className="bottom-[30%] left-[22%] border-b border-l" />
          <HudCorner className="bottom-[30%] right-[22%] border-b border-r" />

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2">
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/90" />
            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/90" />
          </div>

          <div className="pointer-events-none absolute bottom-6 left-4 font-mono text-[9px] uppercase tracking-[0.2em] text-white">
            <div className="mb-2 flex items-end gap-1">
              <span>L</span>
              <Meter />
            </div>
            <div className="mb-2 flex items-end gap-1">
              <span>R</span>
              <Meter active={9} />
            </div>
            <div>ISO 100 INFO F2.8</div>
          </div>

          <div className="pointer-events-none absolute bottom-6 right-4 text-right font-mono text-[9px] uppercase tracking-[0.2em] text-white">
            <div>HD 2K 60PX FPS60</div>
            <div>3840x2160</div>
            <div>{cameraLabel}</div>
          </div>

          {settings.showTimestamp ? (
            <div
              className="pointer-events-none absolute bottom-16 right-6 font-mono text-sm tracking-[0.18em]"
              style={{
                color: activeFilter.dateTint,
                transform: `rotate(${dateAngle}deg)`
              }}
            >
              {new Date().toLocaleDateString("ru-RU")}
            </div>
          ) : null}

          {isStarting ? (
            <div className="absolute inset-0 grid place-items-center bg-black/45">
              <div className="border border-white px-4 py-2 font-mono text-xs uppercase tracking-[0.28em] text-white">
                Connecting Camera
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 border border-red-400 bg-black/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-red-300">
              {error}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="absolute right-4 top-4 z-20 rounded-full border border-white/65 bg-black/45 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.26em] text-white backdrop-blur-sm"
        >
          Set
        </button>

        <button
          type="button"
          onClick={capturePhoto}
          disabled={!isReady || isStarting}
          className="absolute bottom-5 right-4 z-20 h-20 w-20 rounded-full border-4 border-white bg-black/35 text-white shadow-[0_0_30px_rgba(255,255,255,0.15)] backdrop-blur-sm disabled:opacity-50"
        >
          <span className="block h-full w-full rounded-full border-2 border-white/70" />
        </button>

        {isMenuOpen ? (
          <div className="absolute inset-0 z-30 grid place-items-center bg-black/75 px-4">
            <div className="w-full max-w-[720px] border-4 border-[#121212] bg-[#06111d] p-4 shadow-[0_0_0_2px_#31455d]">
              <div className="mb-4 bg-[#d9e6ef] px-3 py-1 text-center font-mono text-[clamp(18px,3vw,34px)] uppercase leading-none tracking-[0.08em] text-black">
                Camera Menu
              </div>

              <div className="space-y-1 font-mono text-[clamp(18px,2.5vw,34px)] uppercase leading-[1.05] tracking-[0.04em] text-white">
                {FILTERS.map((filter, index) => {
                  const isActive = filter.id === activeFilter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() =>
                        setSettings((current) => ({
                          ...current,
                          filterId: filter.id
                        }))
                      }
                      className={`block w-full px-3 py-1 text-left ${
                        isActive ? "bg-[#47cc5c] text-black" : "bg-transparent text-white"
                      }`}
                    >
                      {index + 1}. {filter.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = devices.findIndex((device) => device.deviceId === activeDeviceId);
                    const nextDevice = devices[(currentIndex + 1) % devices.length];
                    if (nextDevice) {
                      void startCamera(nextDevice.deviceId);
                    }
                  }}
                  className="block w-full px-3 py-1 text-left"
                >
                  5. Lens Select
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      showTimestamp: !current.showTimestamp
                    }))
                  }
                  className="block w-full px-3 py-1 text-left"
                >
                  6. Date Stamp {settings.showTimestamp ? "On" : "Off"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      grainBoost: current.grainBoost >= 1.2 ? 0.65 : Number((current.grainBoost + 0.15).toFixed(2))
                    }))
                  }
                  className="block w-full px-3 py-1 text-left"
                >
                  7. Grain {settings.grainBoost.toFixed(2)}x
                </button>
              </div>

              <div className="mt-6 bg-[#d9e6ef] px-3 py-1 text-center font-mono text-[clamp(16px,2.1vw,28px)] uppercase leading-none tracking-[0.08em] text-black">
                Push Menu To Exit
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="mt-4 w-full border border-white px-3 py-2 font-mono text-sm uppercase tracking-[0.24em] text-white"
              >
                Menu
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function HudCorner({ className }: { className: string }) {
  return <div className={`pointer-events-none absolute h-4 w-4 border-white/90 ${className}`} />;
}

function Meter({ active = 11 }: { active?: number }) {
  return (
    <div className="flex items-end gap-px">
      {Array.from({ length: 12 }).map((_, index) => (
        <span
          key={index}
          className={`block w-[3px] ${index < active ? "bg-white" : "bg-white/30"}`}
          style={{ height: `${4 + (index % 6) * 2}px` }}
        />
      ))}
    </div>
  );
}
