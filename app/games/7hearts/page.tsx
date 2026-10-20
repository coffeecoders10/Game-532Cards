import type { Metadata } from "next";
import { Game7HeartsHome } from "@/games/7hearts/components/Game7HeartsHome";

export const metadata: Metadata = {
  title: "7 of Hearts",
  description: "A card game for three to five. Build every suit out from the seven and be first to empty your hand.",
};

export default function Page() {
  return <Game7HeartsHome />;
}
