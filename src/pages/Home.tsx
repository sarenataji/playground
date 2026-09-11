import { Hero } from "@/components/Hero";
import { Verbs } from "@/components/Verbs";
import { RoomGrid } from "@/components/RoomGrid";
import { Close } from "@/components/Close";

export function Home() {
  return (
    <main className="page page-home">
      <Hero />
      <Verbs />
      <section className="atlas" id="atlas">
        <div className="section-head">
          <p className="kicker">Fourteen rooms, fourteen weathers</p>
          <h2 className="display">Go where the mind feels alive.</h2>
          <p className="lede">
            Each room keeps its own weather. Enter one. Stay as long as you
            want. Come back when you are ready.
          </p>
        </div>
        <RoomGrid />
      </section>
      <Close />
    </main>
  );
}
