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

const FILTERS: FilterDefinition[] = [
  {
    id: "sunset-superia",
    name: "Sunset Superia",
    description: "Теплая пленка с янтарными тенями.",
    filter: "sepia(0.42) saturate(1.45) contrast(1.22) brightness(1.04) hue-rotate(-10deg)",
    tone: [255, 166, 85],
    lightLeak: "from-orange-400/30 via-amber-200/12 to-transparent",
    dateTint: "#ffd28c",
    vignette: 0.3,
    grain: 0.18
  },
  {
    id: "neon-vhs",
    name: "Neon VHS",
    description: "Холодный VHS с яркими бликами.",
    filter: "contrast(1.28) saturate(1.5) brightness(0.96) hue-rotate(14deg)",
    tone: [74, 214, 201],
    lightLeak: "from-fuchsia-500/25 via-cyan-300/10 to-transparent",
    dateTint: "#92fff4",
    vignette: 0.4,
    grain: 0.24
  },
  {
    id: "mono-noir",
    name: "Mono Noir",
    description: "Жесткий монохромный режим.",
    filter: "grayscale(1) contrast(1.4) brightness(0.92)",
    tone: [240, 240, 240],
    lightLeak: "from-white/14 via-transparent to-black/20",
    dateTint: "#f5f5f5",
    vignette: 0.46,
    grain: 0.22
  },
  {
    id: "polaroid-dream",
    name: "Polaroid Dream",
    description: "Мягкий выцветший полароид.",
    filter: "sepia(0.22) saturate(1.1) contrast(0.9) brightness(1.12)",
    tone: [255, 214, 180],
    lightLeak: "from-rose-200/26 via-amber-100/15 to-transparent",
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

  const activeFilter = useMemo(
    () => FILTERS.find((filter) => filter.id === settings.filterId) ?? FILTERS[0],
    [settings.filterId]
  );

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
      ctx.font = `${Math.max(18, width * 0.022)}px monospace`;
      ctx.textAlign = "right";
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = filter.dateTint;
      ctx.fillText(stamp, width - 26, height - 24);
      ctx.shadowBlur = 0;
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
    devices.find((device) => device.deviceId === activeDeviceId)?.label || "Камера не определена";

  return (
    <main className="min-h-screen bg-[#161616] px-3 py-4 text-[#d8e1c8] sm:px-6">
      <a ref={downloadAnchorRef} className="hidden" />
      <canvas ref={previewCanvasRef} className="hidden" />

      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[32px] border border-black/60 bg-[#716d62] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          <div className="rounded-[26px] border border-black/40 bg-[#4d4a43] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between border-b border-black/25 pb-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[#1b1b18]">
              <span>Retro Cam DC-2003</span>
              <span>{activeFilter.name}</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_250px]">
              <div className="relative overflow-hidden rounded-[22px] border-[10px] border-[#20211d] bg-[#0b0f0a]">
                <video
                  ref={videoRef}
                  className="h-full min-h-[420px] w-full object-cover lg:min-h-[720px]"
                  autoPlay
                  muted
                  playsInline
                  style={{ filter: activeFilter.filter }}
                />

                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(213,232,176,0.07),rgba(0,0,0,0.12))]" />
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${activeFilter.lightLeak}`} />
                <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(to_bottom,rgba(216,225,200,0.16),rgba(216,225,200,0.16)_1px,transparent_1px,transparent_4px)]" />

                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md border border-[#46513d] bg-[#171d16]/85 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#cdd8b6]">
                  <span className="h-2 w-2 rounded-full bg-[#c7ff71]" />
                  Rec
                </div>

                <div className="absolute right-3 top-3 rounded-md border border-[#46513d] bg-[#171d16]/85 px-2 py-1 font-mono text-[11px] text-[#cdd8b6]">
                  CAM {devices.length || 1}
                </div>

                {settings.showTimestamp ? (
                  <div
                    className="pointer-events-none absolute bottom-3 right-3 font-mono text-sm tracking-[0.2em]"
                    style={{ color: activeFilter.dateTint }}
                  >
                    {new Date().toLocaleDateString("ru-RU")}
                  </div>
                ) : null}

                {isStarting ? (
                  <div className="absolute inset-0 grid place-items-center bg-[#10130f]/78">
                    <div className="rounded-md border border-[#516047] bg-[#1a2218] px-4 py-2 font-mono text-xs uppercase tracking-[0.28em] text-[#cdd8b6]">
                      Подключение камеры
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div className="absolute inset-x-3 bottom-3 rounded-md border border-[#654d40] bg-[#2b1d17]/90 p-3 font-mono text-xs text-[#ffd4bd]">
                    {error}
                  </div>
                ) : null}
              </div>

              <aside className="flex flex-col justify-between gap-4">
                <div className="rounded-[22px] border border-black/35 bg-[#2d2b27] p-3">
                  <div className="rounded-[16px] border border-[#4d5a46] bg-[#b8c79c] px-3 py-3 font-mono text-[12px] leading-5 text-[#25311d] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em]">
                      <span>Mode</span>
                      <span>Photo</span>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div>FILTER: {activeFilter.name}</div>
                      <div>CAMERA: {devices.length || 1}</div>
                      <div>SAVE: JPG</div>
                      <div>{isReady ? "STATUS: READY" : "STATUS: BOOT"}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen((current) => !current)}
                    className="rounded-[18px] border border-black/35 bg-[#2a2a26] px-4 py-3 font-mono text-xs uppercase tracking-[0.28em] text-[#ece7d5]"
                  >
                    Menu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = devices.findIndex(
                        (device) => device.deviceId === activeDeviceId
                      );
                      const nextDevice = devices[(currentIndex + 1) % devices.length];
                      if (nextDevice) {
                        void startCamera(nextDevice.deviceId);
                      }
                    }}
                    disabled={devices.length < 2 || isStarting}
                    className="rounded-[18px] border border-black/35 bg-[#2a2a26] px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-[#ece7d5] disabled:opacity-50"
                  >
                    Lens
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!isReady || isStarting}
                    className="col-span-2 rounded-[24px] border border-black/40 bg-[#d2c6af] px-4 py-5 font-mono text-sm uppercase tracking-[0.32em] text-[#191713] disabled:opacity-50"
                  >
                    Shutter
                  </button>
                </div>
              </aside>
            </div>
          </div>

          {isMenuOpen ? (
            <div className="absolute inset-0 flex items-end justify-end bg-black/28 p-3 sm:p-5">
              <div className="w-full max-w-[360px] rounded-[24px] border border-black/55 bg-[#2a2925] p-4 shadow-[0_30px_60px_rgba(0,0,0,0.45)]">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="font-mono text-xs uppercase tracking-[0.32em] text-[#ece7d5]">
                    Camera Menu
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-md border border-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-[#cfd6be]"
                  >
                    Exit
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-[#aeb89d]">
                      Camera Select
                    </span>
                    <select
                      value={activeDeviceId ?? ""}
                      onChange={(event) => void startCamera(event.target.value)}
                      className="w-full rounded-[14px] border border-[#485344] bg-[#151713] px-3 py-3 font-mono text-sm text-[#d8e1c8] outline-none"
                    >
                      {devices.map((device, index) => (
                        <option key={device.deviceId} value={device.deviceId} className="bg-[#151713]">
                          {device.label || `Камера ${index + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#aeb89d]">
                      Picture Style
                    </div>
                    <div className="space-y-2">
                      {FILTERS.map((filter) => {
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
                            className={`w-full rounded-[14px] border px-3 py-3 text-left font-mono text-sm ${
                              isActive
                                ? "border-[#718365] bg-[#b8c79c] text-[#1e2718]"
                                : "border-[#43473d] bg-[#181916] text-[#d8e1c8]"
                            }`}
                          >
                            <div className="uppercase tracking-[0.18em]">{filter.name}</div>
                            <div className={`${isActive ? "text-[#314127]" : "text-[#98a38a]"} mt-1 text-xs`}>
                              {filter.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <RangeSetting
                    label="Grain"
                    value={settings.grainBoost}
                    min={0.4}
                    max={1.6}
                    step={0.05}
                    onChange={(value) =>
                      setSettings((current) => ({
                        ...current,
                        grainBoost: value
                      }))
                    }
                  />
                  <RangeSetting
                    label="Vignette"
                    value={settings.vignetteBoost}
                    min={0.3}
                    max={1.5}
                    step={0.05}
                    onChange={(value) =>
                      setSettings((current) => ({
                        ...current,
                        vignetteBoost: value
                      }))
                    }
                  />

                  <label className="flex items-center justify-between rounded-[14px] border border-[#43473d] bg-[#181916] px-3 py-3 font-mono text-sm text-[#d8e1c8]">
                    <span>Date Stamp</span>
                    <input
                      type="checkbox"
                      checked={settings.showTimestamp}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          showTimestamp: event.target.checked
                        }))
                      }
                      className="h-4 w-4 accent-[#b8c79c]"
                    />
                  </label>

                  <div className="rounded-[14px] border border-[#43473d] bg-[#181916] px-3 py-3 font-mono text-xs leading-5 text-[#98a38a]">
                    <div>ACTIVE: {activeFilter.name}</div>
                    <div>DEVICE: {cameraLabel}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function RangeSetting({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-[14px] border border-[#43473d] bg-[#181916] px-3 py-3">
      <div className="mb-3 flex items-center justify-between font-mono text-sm text-[#d8e1c8]">
        <span>{label}</span>
        <span>{value.toFixed(2)}x</span>
      </div>
      <input
        className="range-slider w-full"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
