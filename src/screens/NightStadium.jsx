import { useEffect, useRef } from 'react';
import { drawNightStadium } from '../game/nightStadium';

export default function NightStadium() {
  const canvasRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      drawNightStadium(canvas.getContext('2d'), image, canvas.width, canvas.height);
    };
    image.src = '/field/stadium.png?v=2';
    return () => { cancelled = true; };
  }, []);
  return <canvas className="night-stadium" ref={canvasRef} width={1600} height={1000} aria-hidden="true" />;
}
