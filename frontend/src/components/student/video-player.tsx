'use client';

import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

interface VideoPlayerProps {
  url: string;
  onEnded?: () => void;
  onProgress?: (progress: { played: number; playedSeconds: number }) => void;
}

export function VideoPlayer({ url, onEnded, onProgress }: VideoPlayerProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <ReactPlayer
        url={url}
        width="100%"
        height="100%"
        controls
        onEnded={onEnded}
        onProgress={onProgress}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
            },
          },
        }}
      />
    </div>
  );
}
