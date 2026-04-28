import { useEffect, useRef, useState } from "react";

// Multiplier converting the config glow value and size into a CSS drop-shadow radius (px)
const GLOW_SCALE_FACTOR = 0.1;

export default function StarAnimation({ config, size = 128 }) {
  const [frames, setFrames] = useState([]);
  const frameIndex = useRef(0);
  const raf = useRef(null);
  const [currentFrame, setCurrentFrame] = useState(null);

  useEffect(() => {
    async function loadFrames() {
      const loaded = [];
      for (let i = 0; i < config.frames; i++) {
        const img = new Image();
        img.src = `${config.spritePath}${i}.png`;
        try {
          await img.decode();
        } catch (err) {
          console.error(`StarAnimation: failed to load frame ${i} for "${config.name}":`, err);
          continue;
        }
        loaded.push(img);
      }
      setFrames(loaded);
      setCurrentFrame(loaded[0] ?? null);
    }
    loadFrames();
  }, [config]);

  useEffect(() => {
    if (frames.length === 0) return;

    const frameDuration = 1000 / config.frameRate;

    let lastTime = performance.now();

    function animate(now) {
      if (now - lastTime >= frameDuration) {
        const next = (frameIndex.current + 1) % frames.length;

        if (!config.loop && next === 0) {
          setCurrentFrame(frames[frames.length - 1]);
          return;
        }

        frameIndex.current = next;
        setCurrentFrame(frames[next]);
        lastTime = now;
      }
      raf.current = requestAnimationFrame(animate);
    }

    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [frames, config]);

  if (!currentFrame) return null;

  return (
    <img
      src={currentFrame.src}
      width={size}
      height={size}
      alt={config.name}
      style={config.glow ? { filter: `drop-shadow(0 0 ${size * config.glow * GLOW_SCALE_FACTOR}px gold)` } : undefined}
    />
  );
}
