import type { Metadata } from "next";
import { Suspense } from "react";
import { RoomClient } from "@/games/7hearts/components/RoomClient";
import { StatusScreen } from "@/components/ui/StatusScreen";

export const metadata: Metadata = {
  title: "Table · 7 of Hearts",
  robots: { index: false },
};

async function Room({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <RoomClient code={code.toUpperCase()} />;
}

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={<StatusScreen busy title="Pulling up a chair…" />}>
      <Room params={params} />
    </Suspense>
  );
}
