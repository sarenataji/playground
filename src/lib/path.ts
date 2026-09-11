import { useEffect, useState } from "react";

let current = typeof window === "undefined" ? "/" : window.location.pathname;
const listeners = new Set<() => void>();

function sync() {
  current = window.location.pathname.replace(/\/+$/, "") || "/";
  listeners.forEach((fn) => fn());
}

export function go(to: string) {
  const next = to.replace(/\/+$/, "") || "/";
  if (next === current) return;
  window.history.pushState({}, "", next);
  sync();
}

export function usePath() {
  const [path, setPath] = useState(current);

  useEffect(() => {
    const onChange = () => setPath(window.location.pathname.replace(/\/+$/, "") || "/");
    listeners.add(onChange);
    window.addEventListener("popstate", sync);
    onChange();
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  return path;
}

export function handleNavClick(e: MouseEvent) {
  const a = (e.target as HTMLElement | null)?.closest?.("a");
  if (!a) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("http") || href.startsWith("mailto:")) return;
  if (href.startsWith("#")) return;
  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin) return;
  e.preventDefault();
  go(url.pathname);
}
