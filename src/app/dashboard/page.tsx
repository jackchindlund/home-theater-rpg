"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PixelCard } from "@/components/layout/pixel-card";
import { PlaceholderIcon, SampleSprite } from "@/components/ui/placeholders";
import { getPlayerByEmployeeNumber, getQuestProgressForEmployee } from "@/lib/firestore/player-service";
import { getWorldByIndex } from "@/lib/config/worlds";
import { getActiveEmployeeNumber } from "@/lib/session/player-session";
import type { Player, QuestProgress } from "@/lib/types/game";

export default function DashboardPage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [questProgress, setQuestProgress] = useState<QuestProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlayer() {
      setError(null);
      setIsLoading(true);
      try {
        const employeeNumber = getActiveEmployeeNumber();
        if (!employeeNumber) {
          setError("No active employee found. Return to entry screen.");
          return;
        }
        const [loadedPlayer, loadedQuestProgress] = await Promise.all([
          getPlayerByEmployeeNumber(employeeNumber),
          getQuestProgressForEmployee(employeeNumber),
        ]);
        if (!loadedPlayer) {
          setError("Player profile not found.");
          return;
        }
        setPlayer(loadedPlayer);
        setQuestProgress(loadedQuestProgress);
      } catch (loadError) {
        console.error(loadError);
        setError("Could not load dashboard profile data.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadPlayer();
  }, []);

  const currentEnemyName = player
    ? getWorldByIndex(player.currentWorld).enemies[player.currentEnemyIndex]?.name ?? "Unknown enemy"
    : "--";
  const xpToNextLevel = 100;
  const currentLevelXp = player ? player.xp % xpToNextLevel : 0;
  const xpPercent = player ? Math.min(100, Math.round((currentLevelXp / xpToNextLevel) * 100)) : 0;

  return (
    <AppShell title="Player Dashboard" subtitle="Your hub for level, progress, and quick actions.">
      <div className="grid gap-4 md:grid-cols-3">
        <PixelCard title="Level">
          <p className="text-2xl text-[#edf2ff]">{player?.level ?? "--"}</p>
        </PixelCard>
        <PixelCard title="XP Progress">
          <p className="text-2xl text-[#edf2ff]">{player ? `${player.xp} XP` : "--"}</p>
          <div className="xp-track mt-3">
            <div className="xp-fill" style={{ width: `${xpPercent}%` }} />
          </div>
          <p className="mt-2 text-sm text-[#9fb8f5]">
            {player ? `${currentLevelXp}/${xpToNextLevel} to next level` : "--"}
          </p>
        </PixelCard>
        <PixelCard title="Gold">
          <p className="text-2xl text-[#edf2ff]">{player ? `${player.gold}G` : "--"}</p>
        </PixelCard>
      </div>

      <PixelCard title="Current Encounter" subtitle="Enemy/Boss state placeholder">
        <div className="mb-3 flex gap-2">
          <PlaceholderIcon label="Enemy" colorClass="tone-purple" glyph="👾" />
          <PlaceholderIcon label="Boss" colorClass="tone-blue" glyph="👑" />
        </div>
        <div className="mb-3">
          <SampleSprite title="Enemy Sprite" toneClass="tone-purple" />
        </div>
        <p className="text-lg text-[#c4d6ff]">Enemy: {currentEnemyName}</p>
        <p className="text-lg text-[#c4d6ff]">HP: {player?.currentEnemyHp ?? "--"}</p>
      </PixelCard>

      <PixelCard title="Active Quests" subtitle="Daily + weekly quest placeholder">
        <div className="space-y-2">
          {questProgress.map((quest) => (
            <div key={quest.id} className="pixel-tag flex items-center justify-between gap-2 px-3 py-2">
              <span>{quest.questId}</span>
              <span>
                {quest.progress}/{quest.target}
              </span>
            </div>
          ))}
          {questProgress.length === 0 ? (
            <p className="text-lg text-[#c4d6ff]">No quest progress yet. Submit a sale to start tracking.</p>
          ) : null}
        </div>
      </PixelCard>

      {isLoading ? <p className="pixel-subtitle">Loading player profile...</p> : null}
      {error ? <p className="text-[#ff7d7d]">{error}</p> : null}
    </AppShell>
  );
}
