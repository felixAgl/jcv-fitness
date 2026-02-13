import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const useFadeIn = (delay = 0) => {
  const frame = useCurrentFrame();
  return interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

export const useSlideUp = (delay = 0) => {
  const frame = useCurrentFrame();
  return interpolate(frame - delay, [0, 20], [50, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

export const useSlideIn = (direction: 'left' | 'right' = 'left', delay = 0) => {
  const frame = useCurrentFrame();
  const start = direction === 'left' ? -100 : 100;
  return interpolate(frame - delay, [0, 25], [start, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

export const useScale = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });
};

export const useTypewriter = (text: string, speed = 2) => {
  const frame = useCurrentFrame();
  const charsToShow = Math.floor(frame / speed);
  return text.slice(0, charsToShow);
};

export const useGlowPulse = () => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame * 0.1) * 0.5 + 0.5;
  return 10 + pulse * 20;
};
