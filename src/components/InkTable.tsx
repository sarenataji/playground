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
        <p className="kicker">A place to play without thinking</p>
        <h2 className="display">Leave a mark. Or don’t.</h2>
        <p className="lede">
          Drag to paint. Click to splash. Type <kbd>ink</kbd> anywhere if you
          want the page to flood. There is no score.
        </p>
      </div>
      <div className="table-well well">
        <p>Stay as long as you like. The ink will wait.</p>
      </div>
    </section>
  );
}
