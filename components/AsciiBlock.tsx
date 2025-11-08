'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_COLS = 92;
const DEFAULT_ROWS = 36;
const DEFAULT_DENSITY = ' .:-=+*#%@';
const DEFAULT_PERIOD_MS = 3200;
const FRAME_INTERVAL_MS = 1000 / 30;
const DRAW_SIZE = 420;

type AsciiMode = 'video' | 'procedural';

const easeInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

const createPlaceholder = (cols: number, rows: number) =>
  Array.from({ length: rows }, () => ' '.repeat(cols)).join('\n');

const toAscii = (data: Uint8ClampedArray, cols: number, rows: number, density: string) => {
  const ramp = density.length > 0 ? density : DEFAULT_DENSITY;
  const maxIndex = ramp.length - 1;
  let output = '';

  for (let row = 0; row < rows; row++) {
    let rowChars = '';
    for (let col = 0; col < cols; col++) {
      const offset = (row * cols + col) * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const normalized = Math.min(1, Math.max(0, luminance / 255));
      const charIndex = maxIndex === 0 ? 0 : Math.round(normalized * maxIndex);
      rowChars += ramp.charAt(charIndex);
    }
    output += rowChars;
    if (row < rows - 1) {
      output += '\n';
    }
  }

  return output;
};

interface AsciiBlockProps {
  mode?: AsciiMode;
  src?: string;
  cols?: number;
  rows?: number;
  density?: string;
  periodMs?: number;
  className?: string;
}

export function AsciiBlock({
  mode = 'video',
  src = '/hero.mp4',
  cols = DEFAULT_COLS,
  rows = DEFAULT_ROWS,
  density = DEFAULT_DENSITY,
  periodMs = DEFAULT_PERIOD_MS,
  className,
}: AsciiBlockProps) {
  const placeholder = useMemo(() => createPlaceholder(cols, rows), [cols, rows]);
  const [ascii, setAscii] = useState<string>(() => placeholder);
  const asciiRef = useRef<string>(placeholder);
  const reduceMotionRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [useProceduralFallback, setUseProceduralFallback] = useState(false);

  const effectiveMode: AsciiMode = useMemo(
    () => (useProceduralFallback ? 'procedural' : mode),
    [mode, useProceduralFallback]
  );

  const containerClassName = useMemo(() => {
    const baseClass =
      'grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-[2rem] border border-orange-400/45 bg-[#ff6b35] p-2 shadow-[inset_0_0_45px_rgba(0,0,0,0.18)] ring-1 ring-orange-300/30 [clip-path:polygon(0_30%,15%_30%,15%_15%,30%_15%,30%_0,100%_0,100%_100%,30%_100%,30%_85%,15%_85%,15%_70%,0_70%)]';
    return className ? `${baseClass} ${className}` : baseClass;
  }, [className]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      reduceMotionRef.current = mediaQuery.matches;
      if (mediaQuery.matches) {
        videoRef.current?.pause();
      } else if (effectiveMode === 'video') {
        videoRef.current?.play().catch(() => undefined);
      }
    };

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, [effectiveMode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || mode !== 'video') {
      return;
    }

    const handleError = () => setUseProceduralFallback(true);
    const handleCanPlay = () => setUseProceduralFallback(false);

    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);
    video.load();
    video.play().catch(() => undefined);

    return () => {
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [mode, src]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const drawCanvas = document.createElement('canvas');
    drawCanvas.width = DRAW_SIZE;
    drawCanvas.height = DRAW_SIZE;
    const drawCtx = drawCanvas.getContext('2d', { willReadFrequently: true });

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = cols;
    sampleCanvas.height = rows;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

    if (!drawCtx || !sampleCtx) {
      return;
    }

    sampleCtx.imageSmoothingEnabled = false;

    let rafId: number;
    let lastFrameTime = 0;
    let staticRendered = false;
    let cancelled = false;

    const densityRamp = density.length > 0 ? density : DEFAULT_DENSITY;

    const convertCurrentFrame = () => {
      sampleCtx.clearRect(0, 0, cols, rows);
      sampleCtx.drawImage(drawCanvas, 0, 0, cols, rows);
      const { data } = sampleCtx.getImageData(0, 0, cols, rows);
      return toAscii(data, cols, rows, densityRamp);
    };

    const renderProceduralFrame = (progress: number) => {
      drawCtx.save();
      drawCtx.setTransform(1, 0, 0, 1, 0, 0);
      drawCtx.clearRect(0, 0, DRAW_SIZE, DRAW_SIZE);
      drawCtx.fillStyle = '#000';
      drawCtx.fillRect(0, 0, DRAW_SIZE, DRAW_SIZE);

      const centerX = DRAW_SIZE / 2;
      const centerY = DRAW_SIZE / 2;

      // Animación más compleja: cubo 3D isométrico rotando
      const angle = progress * Math.PI * 2;
      const size = 140;
      const depth = 80;

      // Escala de respiración
      const breathScale = 1 + 0.08 * Math.sin(progress * Math.PI * 2);

      drawCtx.translate(centerX, centerY);
      drawCtx.scale(breathScale, breathScale);

      // Cara frontal (más clara)
      drawCtx.fillStyle = '#ffffff';
      drawCtx.beginPath();
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Dibujar cubo isométrico
      const pts = [
        [-size / 2, -size / 2],
        [size / 2, -size / 2],
        [size / 2, size / 2],
        [-size / 2, size / 2],
      ];

      // Rotar puntos
      const rotated = pts.map(([x, y]) => {
        const rx = x * cos - y * sin;
        const ry = x * sin + y * cos;
        return [rx, ry * 0.5]; // Proyección isométrica
      });

      // Cara principal
      drawCtx.moveTo(rotated[0][0], rotated[0][1]);
      rotated.forEach(([x, y]) => drawCtx.lineTo(x, y));
      drawCtx.closePath();
      drawCtx.fill();

      // Cara superior (más clara)
      drawCtx.fillStyle = '#dddddd';
      drawCtx.beginPath();
      drawCtx.moveTo(rotated[0][0], rotated[0][1]);
      drawCtx.lineTo(rotated[1][0], rotated[1][1]);
      drawCtx.lineTo(rotated[1][0] + depth * 0.5, rotated[1][1] - depth * 0.5);
      drawCtx.lineTo(rotated[0][0] + depth * 0.5, rotated[0][1] - depth * 0.5);
      drawCtx.closePath();
      drawCtx.fill();

      // Cara lateral (más oscura)
      drawCtx.fillStyle = '#aaaaaa';
      drawCtx.beginPath();
      drawCtx.moveTo(rotated[1][0], rotated[1][1]);
      drawCtx.lineTo(rotated[2][0], rotated[2][1]);
      drawCtx.lineTo(rotated[2][0] + depth * 0.5, rotated[2][1] - depth * 0.5);
      drawCtx.lineTo(rotated[1][0] + depth * 0.5, rotated[1][1] - depth * 0.5);
      drawCtx.closePath();
      drawCtx.fill();

      // Líneas de detalle
      drawCtx.strokeStyle = '#666';
      drawCtx.lineWidth = 2;
      const gridLines = 6;
      for (let i = 1; i < gridLines; i++) {
        const t = i / gridLines;
        // Líneas horizontales
        drawCtx.beginPath();
        const y = rotated[0][1] + (rotated[3][1] - rotated[0][1]) * t;
        const x1 = rotated[0][0] + (rotated[3][0] - rotated[0][0]) * t;
        const x2 = rotated[1][0] + (rotated[2][0] - rotated[1][0]) * t;
        drawCtx.moveTo(x1, y);
        drawCtx.lineTo(x2, y);
        drawCtx.stroke();
      }

      drawCtx.restore();

      return convertCurrentFrame();
    };

    const renderVideoFrame = (video: HTMLVideoElement) => {
      if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        return null;
      }

      drawCtx.save();
      drawCtx.setTransform(1, 0, 0, 1, 0, 0);
      drawCtx.clearRect(0, 0, DRAW_SIZE, DRAW_SIZE);
      drawCtx.fillStyle = '#000';
      drawCtx.fillRect(0, 0, DRAW_SIZE, DRAW_SIZE);

      const videoRatio = video.videoWidth / video.videoHeight;
      const canvasRatio = DRAW_SIZE / DRAW_SIZE;
      let drawWidth = DRAW_SIZE;
      let drawHeight = DRAW_SIZE;

      if (videoRatio > canvasRatio) {
        drawWidth = DRAW_SIZE;
        drawHeight = DRAW_SIZE / videoRatio;
      } else {
        drawHeight = DRAW_SIZE;
        drawWidth = DRAW_SIZE * videoRatio;
      }

      const offsetX = (DRAW_SIZE - drawWidth) / 2;
      const offsetY = (DRAW_SIZE - drawHeight) / 2;

      drawCtx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
      drawCtx.restore();

      return convertCurrentFrame();
    };

    const renderFrame = (timestamp: number) => {
      if (cancelled) {
        return;
      }

      const wantsReduceMotion = reduceMotionRef.current;

      if (wantsReduceMotion) {
        if (!staticRendered) {
          let frame: string | null = null;
          if (effectiveMode === 'video') {
            const video = videoRef.current;
            if (video) {
              video.pause();
              frame = renderVideoFrame(video);
            }
          }
          if (!frame) {
            frame = renderProceduralFrame(0.5);
          }
          if (frame && frame !== asciiRef.current) {
            asciiRef.current = frame;
            setAscii(frame);
          }
          staticRendered = true;
        }
        rafId = window.requestAnimationFrame(renderFrame);
        return;
      }

      staticRendered = false;

      if (timestamp - lastFrameTime < FRAME_INTERVAL_MS) {
        rafId = window.requestAnimationFrame(renderFrame);
        return;
      }

      lastFrameTime = timestamp;

      let frame: string | null = null;

      if (effectiveMode === 'video') {
        const video = videoRef.current;
        if (video) {
          if (video.paused) {
            video.play().catch(() => undefined);
          }
          frame = renderVideoFrame(video);
        }
      } else {
        const progress = periodMs > 0 ? (timestamp % periodMs) / periodMs : 0;
        frame = renderProceduralFrame(progress);
      }

      if (frame && frame !== asciiRef.current) {
        asciiRef.current = frame;
        setAscii(frame);
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      cancelled = true;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [cols, density, effectiveMode, periodMs, rows]);

  return (
    <div className={containerClassName}>
      <span className="sr-only">Animated ASCII rendering of the hero visual.</span>
      <video
        key={src}
        ref={videoRef}
        className="hidden"
        src={src}
        muted
        loop
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        aria-hidden="true"
      />
      <pre
        aria-hidden="true"
        className="h-full w-full overflow-hidden whitespace-pre font-mono text-[10px] leading-[0.72rem] text-orange-50 [text-shadow:0_0_8px_rgba(0,0,0,0.35)]"
      >
        {ascii}
      </pre>
    </div>
  );
}

export default AsciiBlock;
