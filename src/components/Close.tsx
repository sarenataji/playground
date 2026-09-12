import { useRef } from "react";
import { Signature, Sign1, Sign2 } from "@/components/Signatures";

// Export Sign1 and Sign2 directly so they are immediately accessible
export { Sign1, Sign2 };

export function Close() {
  const root = useRef<HTMLElement>(null);

  return (
    <footer ref={root} className="close" id="close">
      <p className="kicker">The thoughts can stay outside</p>
      <p className="display close-title">You can come back.</p>
      
      {/* 
        Signature Component:
        - variant="sign2" (Active): Authentic handwritten signature from notebook with real pen motion.
        - variant="sign1": Original abstract minimalist wave signature.
      */}
      <Signature variant="sign2" triggerRef={root} />

      <p className="close-note">
        This room will be here. Come rest whenever the mind is loud.
      </p>
    </footer>
  );
}
