import { useCallback, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { Gate } from "./components/Gate";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Verbs } from "./components/Verbs";
import { Studies } from "./components/Studies";
import { Shatter } from "./components/Shatter";
import { GravityType } from "./components/GravityType";
import { Magnets } from "./components/Magnets";
import { Corridor } from "./components/Corridor";
import { Springs } from "./components/Springs";
import { Tunnel } from "./components/Tunnel";
import { LiquidWipe } from "./components/LiquidWipe";
import { InkTable } from "./components/InkTable";
import { Arena } from "./components/Arena";
import { Close } from "./components/Close";
import { InkLayer } from "./components/InkLayer";
import { bindPointer } from "./lib/pointer";
import { prefersReducedMotion } from "./lib/motion";

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [open, setOpen] = useState(false);
  const unlock = useCallback(() => setOpen(true), []);

  useEffect(() => bindPointer(), []);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.09,
    });
    lenis.on("scroll", ScrollTrigger.update);
    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);
    document.body.style.overflow = "";

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      e.preventDefault();
      lenis.scrollTo(href, { offset: -12 });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [open]);

  return (
    <>
      {!open && <Gate onUnlock={unlock} />}
      <InkLayer active={open} />
      <div className={`site${open ? " is-open" : ""}`}>
        <Nav />
        <Hero />
        <Verbs />
        <Shatter />
        <GravityType />
        <Magnets />
        <Corridor />
        <Studies />
        <Springs />
        <Tunnel />
        <LiquidWipe />
        <InkTable />
        <Arena />
        <Close />
      </div>
    </>
  );
}
