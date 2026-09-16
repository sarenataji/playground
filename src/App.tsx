import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
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
import { Home } from "./pages/Home";
import { OriginalHome } from "./pages/OriginalHome";
import { RoomPage } from "./pages/RoomPage";
import { bindPointer } from "./lib/pointer";
import { prefersReducedMotion } from "./lib/motion";
import { handleNavClick, usePath } from "./lib/path";
import { roomByPath } from "./lib/rooms";
import { applyTheme } from "./lib/theme";

gsap.registerPlugin(ScrollTrigger);

// Keep rooms that are absent from the scrolling homepage out of its initial load.
const roomModules = {
  "/practice/gap": () => import("./pages/practice/Gap").then((m) => ({ default: m.Gap })),
  "/practice": () => import("./pages/practice/Practice").then((m) => ({ default: m.Practice })),
  "/practice/layers": () => import("./pages/practice/Layers").then((m) => ({ default: m.Layers })),
  "/breathe": () => import("./components/Breath").then((m) => ({ default: m.Breath })),
  "/dawn": () => import("./components/Dawn").then((m) => ({ default: m.Dawn })),
  "/pond": () => import("./components/Pond").then((m) => ({ default: m.Pond })),
  "/bloom": () => import("./components/Bloom").then((m) => ({ default: m.Bloom })),
  "/hum": () => import("./components/Hum").then((m) => ({ default: m.Hum })),
  "/witness": () => import("./pages/Witness").then((m) => ({ default: m.Witness })),
};
const Gap = lazy(roomModules["/practice/gap"]);
const Practice = lazy(roomModules["/practice"]);
const Layers = lazy(roomModules["/practice/layers"]);
const Breath = lazy(roomModules["/breathe"]);
const Dawn = lazy(roomModules["/dawn"]);
const Pond = lazy(roomModules["/pond"]);
const Bloom = lazy(roomModules["/bloom"]);
const Hum = lazy(roomModules["/hum"]);
const Witness = lazy(roomModules["/witness"]);

function RouteReady({ children, path }: { children: ReactNode; path: string }) {
  useEffect(() => {
    // Lazy content must be measured after it mounts, not while its import is pending.
    const frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      // These rooms signal when their asynchronous canvas is ready.
      if (path !== "/witness" && path !== "/weather") {
        window.dispatchEvent(new CustomEvent("journey:ready", { detail: path }));
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [path]);
  return children;
}


function RouteBody({ path }: { path: string }) {
  switch (path) {
    case "/practice/gap":
      return <Gap />;
    case "/practice":
      return <Practice />;
    case "/practice/layers":
      return <Layers />;
    case "/witness":
      return <Witness />;
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
    // Warm a room on navigation intent without downloading every room in advance.
    const preload = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href");
      if (!href) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const load = roomModules[url.pathname as keyof typeof roomModules];
      if (load) void load().catch(() => { /* Navigation can retry a failed preload. */ });
    };
    document.addEventListener("pointerover", preload);
    document.addEventListener("focusin", preload);
    return () => {
      document.removeEventListener("pointerover", preload);
      document.removeEventListener("focusin", preload);
    };
  }, []);

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
      <div
        className={`site${open ? " is-open" : ""}${room.invert ? " is-invert" : ""}${
          path === "/" || path === "/playground" ? " is-scroll-home" : ""
        }`}
      >
        {path !== "/" && path !== "/playground" && <Atmosphere />}
        {path !== "/witness" && <Nav />}
        <Suspense fallback={<main className="page" style={{ minHeight: "100svh" }} aria-busy="true"><p role="status" className="lede">Opening the room…</p></main>}>
          <RouteReady key={path} path={path}><RouteBody path={path} /></RouteReady>
        </Suspense>
      </div>
      <InkLayer active={open} />
    </>
  );
}
