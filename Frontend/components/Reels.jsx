'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/data/api';

// Horizontal scroller of vertical promo videos (reels).
// Tap a card to play/pause; videos are muted + inline for autoplay-friendliness.
export default function Reels() {
  const [videos, setVideos] = useState(null);

  useEffect(() => { api.getVideos().then(setVideos); }, []);

  if (videos && videos.length === 0) return null;

  return (
    <section className="bg-[linear-gradient(180deg,transparent,#f9f2fd_40%,transparent)] pb-5 pt-11">
      <div className="container">
        <div className="section__head">
          <div>
            <h2>From our reels</h2>
            <span className="muted">See how each piece is made</span>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1240px] snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-[18px] pt-1.5">
        {!videos
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="reel reel--skeleton" />)
          : videos.map(v => <Reel key={v.id} video={v} />)}
      </div>
    </section>
  );
}

const reelCard = 'relative aspect-[9/16] w-[200px] shrink-0 cursor-pointer snap-start overflow-hidden rounded-[30px] bg-[#f1e2fb] shadow-[0_10px_40px_rgba(80,40,140,.08)]';

function Reel({ video }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) { el.play(); setPlaying(true); }
    else { el.pause(); setPlaying(false); }
  };

  return (
    <div className={reelCard} onClick={toggle}>
      <video
        ref={ref}
        className="h-full w-full object-cover"
        src={video.src}
        poster={video.poster}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {!playing && (
        <div className="absolute left-1/2 top-1/2 grid h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/[.92] pl-[3px] text-orchid-600 shadow-[0_10px_40px_rgba(80,40,140,.08)]" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgba(46,39,64,.82))] px-3.5 pb-3 pt-[26px] text-white">
        <strong className="block text-[0.92rem]">{video.title}</strong>
        {video.caption && <span className="text-[0.76rem] opacity-85">{video.caption}</span>}
      </div>
    </div>
  );
}
