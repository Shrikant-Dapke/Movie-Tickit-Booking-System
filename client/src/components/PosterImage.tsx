import { useState } from 'react';
import { Clapperboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PosterImageProps {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}

export function PosterImage({ src, alt, className, imgClassName }: PosterImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn('relative overflow-hidden bg-ink-800', className)}>
      {!src || failed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-ink-700 via-ink-800 to-ink-950 text-slate-600">
          <Clapperboard className="h-10 w-10" aria-hidden="true" />
          <span className="px-3 text-center text-[10px] font-semibold uppercase tracking-widest">{alt}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover transition-transform duration-700', imgClassName)}
        />
      )}
    </div>
  );
}
