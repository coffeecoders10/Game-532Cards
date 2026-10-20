import type { Metadata } from "next";
import { Game78Home } from "@/games/78/components/Game78Home";

export const metadata: Metadata = {
  title: "7-8",
  description: "A two-player trick-taking card game. Win your hands, and collect what you are owed.",
};

export default function Page() {
  return <Game78Home />;
}
