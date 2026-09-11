import { Hero } from "@/components/Hero";
import { Verbs } from "@/components/Verbs";
import { Shatter } from "@/components/Shatter";
import { GravityType } from "@/components/GravityType";
import { Magnets } from "@/components/Magnets";
import { Corridor } from "@/components/Corridor";
import { Studies } from "@/components/Studies";
import { Springs } from "@/components/Springs";
import { Tunnel } from "@/components/Tunnel";
import { LiquidWipe } from "@/components/LiquidWipe";
import { InkTable } from "@/components/InkTable";
import { Arena } from "@/components/Arena";
import { Close } from "@/components/Close";

export function OriginalHome() {
  return (
    <>
      <Hero variant="original" />
      <Verbs linked={false} />
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
    </>
  );
}
