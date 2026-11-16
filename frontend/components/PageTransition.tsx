"use client";

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function NavigationMotion() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const previous = useRef(`${pathname}?${search}`);
  useEffect(() => {
    const route = `${pathname}?${search}`;
    if (previous.current === route) return;
    previous.current = route;
    if (pathname.startsWith('/admin') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const mobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    const main = document.querySelector('main');
    const animation = main?.animate([
      { opacity: 0.8, transform: mobile ? 'none' : 'translateY(8px)' },
      { opacity: 1, transform: mobile ? 'none' : 'translateY(0)' },
    ], { duration: mobile ? 160 : 240, easing: 'cubic-bezier(.23,1,.32,1)' });
    return () => animation?.cancel();
  }, [pathname, search]);
  return null;
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return <><Suspense fallback={null}><NavigationMotion /></Suspense>{children}</>;
}
