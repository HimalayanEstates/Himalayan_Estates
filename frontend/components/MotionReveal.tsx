'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function MotionReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const selector = '.section-heading, .category-card, .property-card, .approach-section, .contact-section, .dossier-body, .advisory-body > section, .privacy-content > section';
    let observer: IntersectionObserver | undefined;
    let mutations: MutationObserver | undefined;
    let seen = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const reset = () => {
      observer?.disconnect();
      mutations?.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
      seen = new WeakSet<Element>();
    };
    const setup = () => {
      reset();
      if (pathname.startsWith('/admin') || preference.matches || window.matchMedia('(max-width: 760px), (pointer: coarse)').matches || !('IntersectionObserver' in window)) return;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const animation = entry.target.animate([
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ], { duration: 420, easing: 'cubic-bezier(.23,1,.32,1)' });
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
          observer?.unobserve(entry.target);
        });
      }, { threshold: 0.08 });
      const observe = () => {
        document.querySelectorAll(selector).forEach(node => {
          if (seen.has(node)) return;
          seen.add(node);
          observer?.observe(node);
        });
      };
      observe();
      mutations = new MutationObserver(observe);
      mutations.observe(document.body, { childList: true, subtree: true });
    };
    setup();
    preference.addEventListener('change', setup);
    return () => { reset(); preference.removeEventListener('change', setup); };
  }, [pathname]);

  return null;
}
