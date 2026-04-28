import { useEffect, useRef, useState } from "react";

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
        await img.decode();
        loaded.push(img);
      }
      setFrames(loaded);
      setCurrentFrame(loaded[0]);
    }
    loadFrames();
  }, [config]);

  useEffect(() => {
    if (frames.length === 0) return;

    const frameDuration = 1000 / config.frameRate;

    let lastTime = performance.now();

    function animate(now) {
      if (now - lastTime >= frameDuration) {
        frameIndex.current =
          (frameIndex.current + 1) % frames.length;

        if (!config.loop && frameIndex.current === frames.length - 1) {
          setCurrentFrame(frames[frames.length - 1]);
          return;
        }

        setCurrentFrame(frames[frameIndex.current]);
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
      style={config.glow ? { filter: `drop-shadow(0 0 ${size * config.glow * 0.1}px gold)` } : undefined}
    />
  );
}
