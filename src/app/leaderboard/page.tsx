"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PixelCard } from "@/components/layout/pixel-card";
import { PlaceholderIcon } from "@/components/ui/placeholders";
import { getLeaderboardPlayers } from "@/lib/firestore/player-service";
import type { Player } from "@/lib/types/game";

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setPlayers(await getLeaderboardPlayers());
      } catch (loadError) {
        console.error(loadError);
        setError("Could not load leaderboard.");
      }
    }
    void loadLeaderboard();
  }, []);

  return (
    <AppShell title="Leaderboard" subtitle="Ranked by level then XP.">
      <PixelCard title="Season Rankings">
        <div className="mb-3 flex gap-2">
          <PlaceholderIcon label="Rank" colorClass="tone-blue" glyph="🏆" />
          <PlaceholderIcon label="Level" colorClass="tone-purple" glyph="⭐" />
          <PlaceholderIcon label="Gold" colorClass="tone-green" glyph="💰" />
        </div>
        <div className="space-y-2">
          {players.map((row, index) => (
            <div
              key={row.id}
              className="pixel-tag grid grid-cols-[64px_1fr_80px_80px] items-center gap-2 px-3 py-2 text-base"
            >
              <span>#{index + 1}</span>
              <span>{row.displayName}</span>
              <span>LV {row.level}</span>
              <span>{row.gold}G</span>
            </div>
          ))}
          {players.length === 0 ? <p className="pixel-subtitle">No players yet.</p> : null}
          {error ? <p className="text-[#ff7d7d]">{error}</p> : null}
        </div>
      </PixelCard>
    </AppShell>
  );
}
