'use client';

import { useEffect, useRef } from 'react';

interface Props {
  html: string;
  className?: string;
}

/**
 * Renders sanitised blog post HTML and injects a one-click copy button
 * into every <pre> (code block) after mount.
 *
 * Why a client component?
 * The copy button needs the Clipboard API which only exists in the browser.
 * The HTML itself is already sanitised server-side before being passed here.
 */
export function BlogContent({ html, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preElements = container.querySelectorAll<HTMLPreElement>('pre');
    const cleanups: (() => void)[] = [];

    preElements.forEach((pre) => {
      // Avoid double-injecting on re-renders
      if (pre.querySelector('.copy-code-btn')) return;

      // Make the <pre> a positioning context for the button
      pre.style.position = 'relative';

      // ── Build the button ────────────────────────────────────────────────
      const btn = document.createElement('button');
      btn.className = 'copy-code-btn';
      btn.setAttribute('aria-label', 'Copy code');
      btn.innerHTML = copyIcon();

      let timeout: ReturnType<typeof setTimeout>;

      const handleClick = async () => {
        const code = pre.querySelector('code')?.innerText ?? pre.innerText;
        try {
          await navigator.clipboard.writeText(code);
          btn.innerHTML = checkIcon();
          btn.classList.add('copied');
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            btn.innerHTML = copyIcon();
            btn.classList.remove('copied');
          }, 2000);
        } catch {
          // Clipboard API unavailable (e.g. non-secure context) — silently ignore
        }
      };

      btn.addEventListener('click', handleClick);
      pre.appendChild(btn);

      cleanups.push(() => {
        clearTimeout(timeout);
        btn.removeEventListener('click', handleClick);
        btn.remove();
      });
    });

    return () => cleanups.forEach(fn => fn());
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── SVG helpers (inline so there's no extra import) ──────────────────────────

function copyIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg><span>Copy</span>`;
}

function checkIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg><span>Copied!</span>`;
}
