'use client';

import { AsciiBlock } from '@/components/AsciiBlock';
import { useEffect, useState } from 'react';

interface AsciiCubeCanvasProps {
  className?: string;
}

export default function AsciiCubeCanvas({ className }: AsciiCubeCanvasProps) {
  const [isDesktop, setIsDesktop] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const common = {
    mode: 'procedural' as const,
    cols: 92,
    // Cleaner ramp for crisper shapes
    density: '  .:-=+*#',
    brandText: 'EC',
    brandPhaseStart: 0.94,
    brandDotStep: 10,
    periodMs: 6200,
    charAspect: 1.15,
    asciiGamma: 1.2,
    asciiCeiling: 0.85,
    asciiFloor: 0.1,
    // Visual toggles: default to a clean, readable look
    showBackdrop: false,
    showPipeline: false,
    showGlow: true,
    afterimage: true,
    shineOverlay: true,
    wowFactor: 1.4,
    sparkCount: 3,
    coverage: 0.86,
  };

  // Center composition inside the orange block (avoid left stepped area)
  const desktop = { rows: 68, offsetX: 280, offsetY: -44 };
  const mobile = { rows: 48, offsetX: 128, offsetY: -16 };

  const cfg = isDesktop ? desktop : mobile;

  return <AsciiBlock {...common} {...cfg} className={className} />;
}
