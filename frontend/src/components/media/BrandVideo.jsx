import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

function setRefs(el, ...refs) {
  refs.forEach((ref) => {
    if (!ref) return;
    if (typeof ref === 'function') ref(el);
    else ref.current = el;
  });
}

/** Same floating pause/play used on the homepage hero video. */
export function HeroVideoToggle({
  videoRef,
  className = 'bottom-4 right-4',
}) {
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const el = videoRef?.current;
    if (!el) return undefined;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    setPlaying(!el.paused);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [videoRef]);

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const el = videoRef?.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? 'Pause video' : 'Play video'}
      className={`absolute z-20 h-11 w-11 rounded-full bg-black/50 text-white backdrop-blur-sm grid place-items-center shadow-sk-sm hover:bg-black/65 transition-colors ${className}`}
    >
      {playing ? (
        <Pause size={16} fill="currentColor" strokeWidth={0} />
      ) : (
        <Play size={16} fill="currentColor" strokeWidth={0} className="ml-0.5" />
      )}
    </button>
  );
}

/** Muted looping video that crop-fills its parent (object-fit: cover). */
const BrandVideo = forwardRef(function BrandVideo(
  {
    src,
    poster,
    className = '',
    fit = 'cover',
    position = 'center center',
    fallback,
    autoPlay = true,
    showToggle = false,
    toggleClassName = 'bottom-4 right-4',
  },
  ref,
) {
  const videoRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', 'true');
    el.loop = true;
    el.preload = 'auto';
    if (autoPlay) {
      const play = el.play();
      if (play && typeof play.catch === 'function') play.catch(() => {});
    }
    return undefined;
  }, [src, autoPlay]);

  const showFallback = () => {
    if (videoRef.current) videoRef.current.style.display = 'none';
    if (imgRef.current) imgRef.current.style.display = 'block';
  };

  if (!src && fallback) {
    return <img src={fallback} alt="" className={className} />;
  }

  const video = (
    <video
      ref={(el) => setRefs(el, videoRef, ref)}
      src={src}
      poster={poster || fallback}
      className={`${className} ${fit === 'cover' ? 'object-cover' : 'object-contain'} sk-hero-video`}
      autoPlay={autoPlay}
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      onError={showFallback}
      style={{
        width: '100%',
        height: '100%',
        objectFit: fit,
        objectPosition: position,
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        filter: 'contrast(1.08) saturate(1.12) brightness(1.04)',
      }}
    />
  );

  return (
    <>
      {fallback ? (
        <img
          ref={imgRef}
          src={fallback}
          alt=""
          className={className}
          style={{ display: 'none' }}
        />
      ) : null}
      {video}
      {showToggle ? (
        <HeroVideoToggle videoRef={videoRef} className={toggleClassName} />
      ) : null}
    </>
  );
});

export default BrandVideo;
