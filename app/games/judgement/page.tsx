import type { Metadata } from "next";
import { GameJudgementHome } from "@/games/judgement/components/GameJudgementHome";

export const metadata: Metadata = {
  title: "Judgement",
  description: "A trick-taking game for three to six. Call how many hands you will win, then win exactly that many.",
};

export default function Page() {
  return <GameJudgementHome />;
}
