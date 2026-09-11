import type { ReactNode } from "react";
import { NextPath } from "@/components/NextPath";

export function RoomPage({ children }: { children: ReactNode }) {
  return (
    <main className="page">
      {children}
      <NextPath />
    </main>
  );
}
