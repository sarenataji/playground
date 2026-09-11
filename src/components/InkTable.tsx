import { useEffect } from "react";
import { setOverTable } from "@/lib/inkBus";

export function InkTable() {
  useEffect(() => {
    return () => setOverTable(false);
  }, []);

  return (
    <section
      className="table"
      id="play"
      onPointerEnter={() => setOverTable(true)}
      onPointerLeave={() => setOverTable(false)}
    >
      <div className="section-head">
        <p className="kicker">The function</p>
        <h2 className="display">Ink table.</h2>
        <p className="lede">
          This is the toy the rest of the site is made from. Drag to paint.
          Click to dump a splash. Type <kbd>ink</kbd> anywhere for a flood.
        </p>
      </div>
      <div className="table-well">
        <p>The cursor is the medium. Stay here and slosh.</p>
      </div>
    </section>
  );
}
