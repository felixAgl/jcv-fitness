import { Composition } from 'remotion';
import { PromoVideo } from './compositions/PromoVideo';
import { TOTAL_FRAMES, FPS } from './utils/timing';

export const RemotionRoot = () => {
  return (
    <>
      {/* Horizontal version for web/YouTube */}
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* Vertical version for stories/reels */}
      <Composition
        id="PromoVideoVertical"
        component={PromoVideo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ vertical: true }}
      />
    </>
  );
};
