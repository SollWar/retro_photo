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
  contrast: number;
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
    description: "Теплая пленка с янтарными тенями и плотным контрастом.",
    filter: "sepia(0.42) saturate(1.45) contrast(1.22) brightness(1.04) hue-rotate(-10deg)",
    tone: [255, 166, 85],
    lightLeak: "from-orange-400/30 via-amber-200/12 to-transparent",
    dateTint: "#ffd28c",
    vignette: 0.3,
    grain: 0.18,
    contrast: 1.12
  },
  {
    id: "neon-vhs",
    name: "Neon VHS",
    description: "Грязный VHS с холодным цианом, розовыми бликами и глоу.",
    filter: "contrast(1.28) saturate(1.5) brightness(0.96) hue-rotate(14deg)",
    tone: [74, 214, 201],
    lightLeak: "from-fuchsia-500/25 via-cyan-300/10 to-transparent",
    dateTint: "#92fff4",
    vignette: 0.4,
    grain: 0.24,
    contrast: 1.16
  },
  {
    id: "mono-noir",
    name: "Mono Noir",
    description: "Жесткий черно-белый режим с кинематографической глубиной.",
    filter: "grayscale(1) contrast(1.4) brightness(0.92)",
    tone: [240, 240, 240],
    lightLeak: "from-white/14 via-transparent to-black/20",
    dateTint: "#f5f5f5",
    vignette: 0.46,
    grain: 0.22,
    contrast: 1.24
  },
  {
    id: "polaroid-dream",
    name: "Polaroid Dream",
    description: "Выцветший полароид с молочными светами и мягкими оттенками.",
    filter: "sepia(0.22) saturate(1.1) contrast(0.9) brightness(1.12)",
    tone: [255, 214, 180],
    lightLeak: "from-rose-200/26 via-amber-100/15 to-transparent",
    dateTint: "#fff0d8",
    vignette: 0.2,
    grain: 0.14,
    contrast: 0.94
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
      } catch (cameraError) {
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
    <main className="min-h-screen px-4 py-6 text-cream sm:px-6 lg:px-8">
      <a ref={downloadAnchorRef} className="hidden" />
      <canvas ref={previewCanvasRef} className="hidden" />

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[rgba(18,14,12,0.72)] shadow-glow backdrop-blur-xl">
          <div className="absolute inset-0 bg-noise opacity-90" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative grid min-h-[calc(100vh-3rem)] gap-6 p-4 lg:grid-cols-[1.4fr_0.86fr] lg:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">Retro Photo Lab</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                    Эмулятор ретро-камеры
                  </h1>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-right text-xs uppercase tracking-[0.25em] text-white/60">
                  Static Export
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <InfoCard title="Фильтр" value={activeFilter.name} detail={activeFilter.description} />
                <InfoCard title="Камера" value={`${devices.length || 0}`} detail={cameraLabel} />
                <InfoCard title="Экспорт" value="JPG" detail="Сохранение прямо на устройство" />
              </div>

              <div className="film-grain relative flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-black/70">
                <video
                  ref={videoRef}
                  className="h-full min-h-[380px] w-full object-cover lg:min-h-[720px]"
                  autoPlay
                  muted
                  playsInline
                  style={{ filter: activeFilter.filter }}
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30" />
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${activeFilter.lightLeak}`}
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />

                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs uppercase tracking-[0.28em] text-white/70 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.85)]" />
                  Live View
                </div>

                {settings.showTimestamp ? (
                  <div
                    className="pointer-events-none absolute bottom-4 right-4 font-mono text-sm tracking-[0.2em]"
                    style={{ color: activeFilter.dateTint }}
                  >
                    {new Date().toLocaleDateString("ru-RU")}
                  </div>
                ) : null}

                {isStarting ? (
                  <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-sm">
                    <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm uppercase tracking-[0.3em] text-white/70">
                      Подключение камеры
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-red-300/25 bg-red-950/60 p-4 text-sm text-red-100 backdrop-blur">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <div className="rounded-[28px] border border-white/10 bg-black/25 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">Capture Deck</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!isReady || isStarting}
                    className="rounded-[22px] border border-amber-200/30 bg-gradient-to-br from-amber-100 via-orange-300 to-orange-500 px-4 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-ink transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Снять фото
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
                    className="rounded-[22px] border border-white/15 bg-white/5 px-4 py-4 text-sm font-medium uppercase tracking-[0.2em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Сменить камеру
                  </button>
                </div>

                <label className="mt-4 block text-sm text-white/70">
                  <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">
                    Активная камера
                  </span>
                  <select
                    value={activeDeviceId ?? ""}
                    onChange={(event) => void startCamera(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.06)] px-4 py-3 text-base text-white outline-none transition focus:border-amber-200/40"
                  >
                    {devices.map((device, index) => (
                      <option key={device.deviceId} value={device.deviceId} className="bg-zinc-900">
                        {device.label || `Камера ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/25 p-4 backdrop-blur">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/45">Filters</p>
                  <span className="text-xs text-white/45">Мощные ретро пресеты</span>
                </div>

                <div className="mt-4 grid gap-3">
                  {FILTERS.map((filter) => {
                    const isActive = filter.id === activeFilter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setSettings((current) => ({ ...current, filterId: filter.id }))}
                        className={`rounded-[22px] border p-4 text-left transition ${
                          isActive
                            ? "border-amber-200/35 bg-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.24)]"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-base font-medium text-white">{filter.name}</div>
                            <p className="mt-1 text-sm text-white/58">{filter.description}</p>
                          </div>
                          <div
                            className="h-11 w-11 rounded-2xl border border-white/10"
                            style={{
                              background: `linear-gradient(135deg, rgba(${filter.tone[0]}, ${filter.tone[1]}, ${filter.tone[2]}, 0.95), rgba(15,15,15,0.9))`
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/25 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">Settings</p>
                <div className="mt-4 space-y-4">
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
                  <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
                    <span>Дата на кадре</span>
                    <input
                      type="checkbox"
                      checked={settings.showTimestamp}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          showTimestamp: event.target.checked
                        }))
                      }
                      className="h-5 w-5 accent-amber-300"
                    />
                  </label>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  value,
  detail
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.3em] text-white/45">{title}</p>
      <div className="mt-3 text-xl font-semibold text-white">{value}</div>
      <p className="mt-1 text-sm text-white/55">{detail}</p>
    </div>
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
    <label className="block rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="mb-3 flex items-center justify-between text-sm text-white/70">
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
