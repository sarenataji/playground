import { useEffect, useRef } from "react";
import { pointer } from "@/lib/pointer";
import { getInkNear, setStampObstacle } from "@/lib/inkBus";

export function Stamp() {
  const stampRef = useRef<HTMLDivElement>(null);
  const eyeRef = useRef<SVGGElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = stampRef.current;
    if (!el) return;

    let raf = 0;
    let currentEyeX = 0;
    let currentEyeY = 0;
    let currentMouthX = 0;
    let currentMouthY = 0;

    let blinkTimer = 0;
    let nextBlink = 3.5 + Math.random() * 3.0;
    let blinkProgress = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const rect = el.getBoundingClientRect();
      let scx = window.innerWidth * 0.7;
      let scy = window.innerHeight * 0.35;
      let sRadius = 75;

      if (rect.width > 0 && rect.height > 0) {
        scx = rect.left + rect.width / 2;
        scy = rect.top + rect.height / 2;
        sRadius = (rect.width / 2) * 0.98;
        setStampObstacle({ x: scx, y: scy, radius: sRadius });
      }

      // Track nearby ink trail or pointer
      const nearbyInk = getInkNear(scx, scy, sRadius * 4.0);
      const cursorDist = Math.hypot(pointer.clientX - scx, pointer.clientY - scy);
      const cursorRecent = now - pointer.lastMove < 2500;

      let tx = pointer.clientX;
      let ty = pointer.clientY;

      if (nearbyInk && nearbyInk.strength > 0.06) {
        if (cursorDist < sRadius * 3.0 && cursorRecent) {
          tx = pointer.clientX * 0.65 + nearbyInk.x * 0.35;
          ty = pointer.clientY * 0.65 + nearbyInk.y * 0.35;
        } else {
          tx = nearbyInk.x;
          ty = nearbyInk.y;
        }
      }

      const dx = tx - scx;
      const dy = ty - scy;
      const dist = Math.hypot(dx, dy);

      const nx = dist > 0.001 ? dx / dist : 0;
      const ny = dist > 0.001 ? dy / dist : 0;

      const maxEyeShift = 8.5;
      const shiftStrength = Math.min(1.0, Math.max(0.2, dist / (sRadius * 0.8)));

      const targetEyeX = nx * maxEyeShift * shiftStrength;
      const targetEyeY = ny * maxEyeShift * shiftStrength;
      const targetMouthX = targetEyeX * 0.3;
      const targetMouthY = targetEyeY * 0.2;

      currentEyeX += (targetEyeX - currentEyeX) * 0.14;
      currentEyeY += (targetEyeY - currentEyeY) * 0.14;
      currentMouthX += (targetMouthX - currentMouthX) * 0.12;
      currentMouthY += (targetMouthY - currentMouthY) * 0.12;

      // Natural blink animation
      blinkTimer += dt;
      if (blinkTimer > nextBlink) {
        blinkProgress = 1.0;
        blinkTimer = 0;
        nextBlink = 3.5 + Math.random() * 4.0;
      }

      let scaleY = 1.0;
      if (blinkProgress > 0) {
        blinkProgress = Math.max(0, blinkProgress - dt * 8.5);
        scaleY = 1.0 - Math.sin(blinkProgress * Math.PI) * 0.92;
      }

      if (eyeRef.current) {
        eyeRef.current.setAttribute(
          "transform",
          `translate(${currentEyeX.toFixed(2)}, ${currentEyeY.toFixed(2)}) scale(1, ${scaleY.toFixed(3)})`,
        );
      }
      if (mouthRef.current) {
        mouthRef.current.setAttribute(
          "transform",
          `translate(${currentMouthX.toFixed(2)}, ${currentMouthY.toFixed(2)})`,
        );
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const onResize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setStampObstacle({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          radius: (rect.width / 2) * 0.98,
        });
      }
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
      setStampObstacle(null);
    };
  }, []);

  return (
    <div ref={stampRef} className="stamp" aria-hidden>
      <svg
        className="stamp-ring"
        viewBox="0 0 200 200"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          <path id="stampArc" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>

        {/* Circular text ring */}
        <text className="stamp-type">
          <textPath href="#stampArc" startOffset="0%">
            YOU ARE SAFE HERE · REST · YOU ARE SAFE HERE ·
          </textPath>
        </text>

        {/* Centered smiley face (no cutout) */}
        <circle cx="100" cy="100" r="50" fill="none" stroke="#161412" strokeWidth="4.5" />

        {/* Eyes with gaze tracking */}
        <g ref={eyeRef} style={{ transformOrigin: "100px 92px" }}>
          <circle cx="84.5" cy="92" r="5.2" fill="#161412" />
          <circle cx="115.5" cy="92" r="5.2" fill="#161412" />
        </g>

        {/* Smile vectors */}
        <path
          ref={mouthRef}
          d="M84.5,109.5 Q100,126.5 115.5,109.5"
          fill="none"
          stroke="#161412"
          strokeWidth="4.5"
          strokeLinecap="round"
          style={{ transformOrigin: "100px 118px" }}
        />
      </svg>
    </div>
  );
}
