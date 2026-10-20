import type { Metadata } from "next";
import { Game532Home } from "@/games/532/components/Game532Home";

export const metadata: Metadata = {
  title: "5-3-2",
  description: "A three-player trick-taking card game. Win your hands, trade cards, rotate the table.",
};

export default function Page() {
  return <Game532Home />;
}
