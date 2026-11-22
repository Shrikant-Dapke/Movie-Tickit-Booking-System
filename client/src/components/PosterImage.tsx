import { useEffect, useRef, useState } from 'react';
import { Clapperboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PosterImageProps {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** `backdrop` uses a centred, landscape-friendly crop; `poster` keeps the artwork aligned to the top. */
  variant?: 'poster' | 'backdrop';
  /** Skip lazy loading for above-the-fold artwork such as the hero. */
  eager?: boolean;
}

type LoadState = { src?: string; status: 'loading' | 'loaded' | 'error' };

export function PosterImage({
  src,
  alt,
  className,
  imgClassName,
  variant = 'poster',
  eager = false,
}: PosterImageProps) {
  const [state, setState] = useState<LoadState>({ src, status: 'loading' });
  const imgRef = useRef<HTMLImageElement>(null);

  // Track the source alongside the status so a changed `src` never inherits a
  // stale "loaded"/"error" state from the previously displayed image.
  const status = state.src === src ? state.status : 'loading';
  const isBackdrop = variant === 'backdrop';

  useEffect(() => {
    const img = imgRef.current;
    // A cached image can finish before React attaches onLoad — verify it here.
    if (img?.complete && img.naturalWidth > 0) setState({ src, status: 'loaded' });
  }, [src]);

  return (
    <div className={cn('relative overflow-hidden bg-ink-800', className)}>
      {!src || status === 'error' ? (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-ink-700 via-ink-800 to-ink-950 text-slate-500"
          role="img"
          aria-label={alt}
        >
          <Clapperboard className={cn('shrink-0 text-brand-500/60', isBackdrop ? 'h-9 w-9' : 'h-10 w-10')} aria-hidden="true" />
          <span className="px-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">{alt}</span>
        </div>
      ) : (
        <>
          {status === 'loading' && <div className="skeleton absolute inset-0" aria-hidden="true" />}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setState({ src, status: 'loaded' })}
            onError={() => setState({ src, status: 'error' })}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-500',
              isBackdrop ? 'object-center' : 'object-top',
              status === 'loaded' ? 'opacity-100' : 'opacity-0',
              imgClassName,
            )}
          />
        </>
      )}
    </div>
  );
}
