"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PixelCard } from "@/components/layout/pixel-card";
import { PlaceholderIcon } from "@/components/ui/placeholders";
import { DEFAULT_WORLDS } from "@/lib/config/worlds";
import { getPlayerByEmployeeNumber } from "@/lib/firestore/player-service";
import { getActiveEmployeeNumber } from "@/lib/session/player-session";
import type { Player } from "@/lib/types/game";

type WorldState = "cleared" | "current" | "locked";

function worldState(player: Player, worldIndex: number): WorldState {
  if (player.currentWorld > worldIndex) {
    return "cleared";
  }
  if (player.currentWorld === worldIndex) {
    return "current";
  }
  return "locked";
}

export default function MapPage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      setIsLoading(true);
      try {
        const employeeNumber = getActiveEmployeeNumber();
        if (!employeeNumber) {
          setError("No active employee found. Return to entry screen.");
          setPlayer(null);
          return;
        }
        const loaded = await getPlayerByEmployeeNumber(employeeNumber);
        if (!loaded) {
          setError("Player profile not found.");
          setPlayer(null);
          return;
        }
        setPlayer(loaded);
      } catch (e) {
        console.error(e);
        setError("Could not load map data.");
        setPlayer(null);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const currentEnemyName =
    player && player.currentWorld >= 1 && player.currentWorld <= DEFAULT_WORLDS.length
      ? DEFAULT_WORLDS[player.currentWorld - 1]?.enemies[player.currentEnemyIndex]?.name ?? "—"
      : "—";

  return (
    <AppShell title="Map" subtitle="World progression matches combat — same data as dashboard and sales.">
      <PixelCard title="World Path" subtitle="Cleared · Current · Locked">
        <div className="mb-4 flex flex-wrap gap-2">
          <PlaceholderIcon label="Cleared" colorClass="tone-green" glyph="🟢" />
          <PlaceholderIcon label="Current" colorClass="tone-blue" glyph="📍" />
          <PlaceholderIcon label="Locked" colorClass="tone-purple" glyph="🔒" />
        </div>

        {player ? (
          <p className="mb-4 text-sm text-[#9fb8f5]">
            Bosses cleared (lifetime): <span className="text-[#edf2ff]">{player.bossesCleared}</span> · Current fight:{" "}
            <span className="text-[#edf2ff]">{currentEnemyName}</span>
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DEFAULT_WORLDS.map((world) => {
            const state = player ? worldState(player, world.worldIndex) : "locked";
            const label = state === "cleared" ? "Cleared" : state === "current" ? "Current" : "Locked";
            const labelColor =
              state === "cleared"
                ? "text-[#7aff9d]"
                : state === "current"
                  ? "text-[#9fb8f5]"
                  : "text-[#c4b8ff]";

            return (
              <div
                key={world.id}
                className={`pixel-tag flex flex-col gap-2 p-3 text-center ${state === "current" ? "ring-2 ring-[#ffd447]" : ""}`}
              >
                <p className="font-semibold text-[#edf2ff]">{world.name}</p>
                <p className={`text-xs uppercase ${labelColor}`}>{label}</p>
                <p className="text-xs text-[#9fb8f5]">
                  {world.enemies.length} encounters · {world.enemies.filter((e) => e.isBoss).length} boss
                </p>
              </div>
            );
          })}
        </div>

        {isLoading ? <p className="mt-4 pixel-subtitle">Loading map...</p> : null}
        {error ? <p className="mt-4 text-[#ff7d7d]">{error}</p> : null}
      </PixelCard>
    </AppShell>
  );
}
