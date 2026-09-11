import { useCallback, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { Gate } from "./components/Gate";
import { Nav } from "./components/Nav";
import { Atmosphere } from "./components/Atmosphere";
import { InkLayer } from "./components/InkLayer";
import { Shatter } from "./components/Shatter";
import { GravityType } from "./components/GravityType";
import { Magnets } from "./components/Magnets";
import { Corridor } from "./components/Corridor";
import { Studies } from "./components/Studies";
import { Springs } from "./components/Springs";
import { Tunnel } from "./components/Tunnel";
import { InkTable } from "./components/InkTable";
import { Arena } from "./components/Arena";
import { Breath } from "./components/Breath";
import { Dawn } from "./components/Dawn";
import { Pond } from "./components/Pond";
import { Bloom } from "./components/Bloom";
import { Hum } from "./components/Hum";
import { Home } from "./pages/Home";
import { OriginalHome } from "./pages/OriginalHome";
import { RoomPage } from "./pages/RoomPage";
import { bindPointer } from "./lib/pointer";
import { prefersReducedMotion } from "./lib/motion";
import { handleNavClick, usePath } from "./lib/path";
import { roomByPath } from "./lib/rooms";
import { applyTheme } from "./lib/theme";

gsap.registerPlugin(ScrollTrigger);

function RouteBody({ path }: { path: string }) {
  switch (path) {
    case "/":
    case "/playground":
      return <OriginalHome />;
    case "/rooms":
      return <Home />;
    case "/breathe":
      return (
        <RoomPage>
          <Breath />
        </RoomPage>
      );
    case "/dawn":
      return (
        <RoomPage>
          <Dawn />
        </RoomPage>
      );
    case "/pond":
      return (
        <RoomPage>
          <Pond />
        </RoomPage>
      );
    case "/bloom":
      return (
        <RoomPage>
          <Bloom />
        </RoomPage>
      );
    case "/hum":
      return (
        <RoomPage>
          <Hum />
        </RoomPage>
      );
    case "/release":
      return (
        <RoomPage>
          <Shatter />
        </RoomPage>
      );
    case "/letters":
      return (
        <RoomPage>
          <GravityType />
        </RoomPage>
      );
    case "/weather":
      return (
        <RoomPage>
          <Magnets />
        </RoomPage>
      );
    case "/walk":
      return (
        <RoomPage>
          <Corridor />
        </RoomPage>
      );
    case "/hold":
      return (
        <RoomPage>
          <Studies />
        </RoomPage>
      );
    case "/return":
      return (
        <RoomPage>
          <Springs />
        </RoomPage>
      );
    case "/depth":
      return (
        <RoomPage>
          <Tunnel />
        </RoomPage>
      );
    case "/ink":
      return (
        <RoomPage>
          <InkTable />
        </RoomPage>
      );
    case "/company":
      return (
        <RoomPage>
          <Arena />
        </RoomPage>
      );
    default:
      return <OriginalHome />;
  }
}

export default function App() {
  const path = usePath();
  const room = roomByPath(path);
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    if (prefersReducedMotion()) return true;
    return sessionStorage.getItem("sarena-open") === "1";
  });

  const unlock = useCallback(() => {
    sessionStorage.setItem("sarena-open", "1");
    setOpen(true);
  }, []);

  useEffect(() => bindPointer(), []);

  useEffect(() => {
    applyTheme(room);
  }, [room]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    window.scrollTo(0, 0);

    if (prefersReducedMotion()) {
      document.body.style.overflow = "";
      const onClick = handleNavClick;
      document.addEventListener("click", onClick);
      return () => document.removeEventListener("click", onClick);
    }

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
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      const href = a?.getAttribute("href");
      if (href?.startsWith("#")) {
        e.preventDefault();
        lenis.scrollTo(href, { offset: -12 });
        return;
      }
      handleNavClick(e);
    };
    document.addEventListener("click", onClick);

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [open, path]);

  return (
    <>
      {!open && <Gate onUnlock={unlock} />}
      <InkLayer active={open} />
      <div
        className={`site${open ? " is-open" : ""}${room.invert ? " is-invert" : ""}${
          path === "/" || path === "/playground" ? " is-scroll-home" : ""
        }`}
      >
        {path !== "/" && path !== "/playground" && <Atmosphere />}
        <Nav />
        <RouteBody path={path} />
      </div>
    </>
  );
}
