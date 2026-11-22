import { Link } from 'react-router-dom';
import { ArrowLeft, Clapperboard } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="container-cine flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-[10rem] leading-none tracking-wide text-brand-500/20 sm:text-[14rem]">404</p>
      <div className="-mt-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-[0_16px_50px_-16px_rgba(229,9,20,1)] sm:-mt-16">
        <Clapperboard className="h-8 w-8" />
      </div>
      <h1 className="mt-6 font-display text-4xl tracking-wide text-white sm:text-5xl">THIS SCENE DOESN&apos;T EXIST</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
        The page you&apos;re looking for has left the theatre. Let&apos;s get you back to the good part.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white transition hover:bg-brand-400"
      >
        <ArrowLeft className="h-4 w-4" /> Back to movies
      </Link>
    </div>
  );
}
