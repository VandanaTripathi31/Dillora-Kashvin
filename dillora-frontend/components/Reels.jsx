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
    <section className="reels">
      <div className="container">
        <div className="section__head">
          <div>
            <h2>From our reels</h2>
            <span className="muted">See how each piece is made</span>
          </div>
        </div>
      </div>
      <div className="reels__track">
        {!videos
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="reel reel--skeleton" />)
          : videos.map(v => <Reel key={v.id} video={v} />)}
      </div>
    </section>
  );
}

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
    <div className="reel" onClick={toggle}>
      <video
        ref={ref}
        className="reel__video"
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
        <div className="reel__play" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
      )}
      <div className="reel__meta">
        <strong>{video.title}</strong>
        {video.caption && <span>{video.caption}</span>}
      </div>
    </div>
  );
}
