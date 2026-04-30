"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PixelCard } from "@/components/layout/pixel-card";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { APPEARANCE_BODIES, APPEARANCE_HAIR } from "@/lib/config/appearance";
import { getPlayerByEmployeeNumber, updatePlayerProfile } from "@/lib/firestore/player-service";
import { getActiveEmployeeNumber } from "@/lib/session/player-session";
import type { Player } from "@/lib/types/game";

function previewPlayer(base: Player, displayName: string, appearanceBodyId: string, appearanceHairId: string): Player {
  return { ...base, displayName, appearanceBodyId, appearanceHairId };
}

export default function ProfilePage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bodyId, setBodyId] = useState("");
  const [hairId, setHairId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setError(null);
      setLoading(true);
      try {
        const employeeNumber = getActiveEmployeeNumber();
        if (!employeeNumber) {
          setError("No active employee found. Use the home screen first.");
          setPlayer(null);
          return;
        }
        const loaded = await getPlayerByEmployeeNumber(employeeNumber);
        if (!loaded) {
          setError("Player not found.");
          setPlayer(null);
          return;
        }
        setPlayer(loaded);
        setDisplayName(loaded.displayName);
        setBodyId(loaded.appearanceBodyId);
        setHairId(loaded.appearanceHairId);
      } catch (e) {
        console.error(e);
        setError("Could not load profile.");
        setPlayer(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const employeeNumber = getActiveEmployeeNumber();
    if (!employeeNumber) {
      setError("No active employee.");
      return;
    }
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const next = await updatePlayerProfile(employeeNumber, {
        displayName,
        appearanceBodyId: bodyId,
        appearanceHairId: hairId,
      });
      setPlayer(next);
      setStatus("Profile saved.");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Profile" subtitle="Display name and paper-doll appearance (48×48 PNG layers).">
      {player ? (
        <div className="grid gap-4 md:grid-cols-[160px_1fr]">
          <PixelCard title="Preview">
            <div className="flex justify-center">
              <PlayerAvatar player={previewPlayer(player, displayName, bodyId, hairId)} size={96} />
            </div>
            <p className="mt-3 text-center text-sm text-[#9fb8f5]">Live preview — Save to store on your profile.</p>
          </PixelCard>
          <PixelCard title="Edit profile">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm uppercase text-[#c4d6ff]" htmlFor="display-name">
                Display name
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={32}
                className="w-full border-3 border-[#5f87e5] bg-[#0c1327] px-3 py-2 outline-none"
              />
              <label className="block text-sm uppercase text-[#c4d6ff]" htmlFor="body-select">
                Body
              </label>
              <select
                id="body-select"
                value={bodyId}
                onChange={(e) => setBodyId(e.target.value)}
                className="w-full border-3 border-[#5f87e5] bg-[#0c1327] px-3 py-2 outline-none"
              >
                {APPEARANCE_BODIES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
              <label className="block text-sm uppercase text-[#c4d6ff]" htmlFor="hair-select">
                Hair
              </label>
              <select
                id="hair-select"
                value={hairId}
                onChange={(e) => setHairId(e.target.value)}
                className="w-full border-3 border-[#5f87e5] bg-[#0c1327] px-3 py-2 outline-none"
              >
                {APPEARANCE_HAIR.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.label}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={saving} className="pixel-button px-4 py-2 uppercase disabled:opacity-60">
                {saving ? "Saving..." : "Save"}
              </button>
            </form>
            {status ? <p className="mt-3 text-[#7aff9d]">{status}</p> : null}
            {error ? <p className="mt-3 text-[#ff7d7d]">{error}</p> : null}
          </PixelCard>
        </div>
      ) : null}
      {loading ? <p className="pixel-subtitle">Loading...</p> : null}
      {!loading && error && !player ? <p className="text-[#ff7d7d]">{error}</p> : null}
    </AppShell>
  );
}
