"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PixelCard } from "@/components/layout/pixel-card";
import { PlaceholderIcon, SampleSprite } from "@/components/ui/placeholders";
import { getItemById } from "@/lib/config/items";
import { equipOrUseItem, getInventoryForEmployee } from "@/lib/firestore/inventory-service";
import { getPlayerByEmployeeNumber } from "@/lib/firestore/player-service";
import { getActiveEmployeeNumber } from "@/lib/session/player-session";
import type { InventoryEntry, ItemCategory, Player } from "@/lib/types/game";

export default function InventoryPage() {
  const [employeeNumber, setEmployeeNumber] = useState<string | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  async function refreshInventory(employee: string) {
    const [entries, loadedPlayer] = await Promise.all([
      getInventoryForEmployee(employee),
      getPlayerByEmployeeNumber(employee),
    ]);
    setInventory(entries);
    setPlayer(loadedPlayer);
  }

  useEffect(() => {
    async function loadData() {
      const activeEmployee = getActiveEmployeeNumber();
      setEmployeeNumber(activeEmployee);
      if (!activeEmployee) {
        setError("No active employee found.");
        return;
      }
      try {
        await refreshInventory(activeEmployee);
      } catch (loadError) {
        console.error(loadError);
        setError("Could not load inventory.");
      }
    }
    void loadData();
  }, []);

  const sections = useMemo(() => {
    const groups: Record<ItemCategory, InventoryEntry[]> = {
      weapon: [],
      armor: [],
      potion: [],
      cosmetic: [],
    };
    for (const entry of inventory) {
      const item = getItemById(entry.itemId);
      if (!item) {
        continue;
      }
      groups[item.category].push(entry);
    }
    return groups;
  }, [inventory]);

  async function handleAction(itemId: string) {
    if (!employeeNumber) {
      return;
    }
    setBusyItemId(itemId);
    setError(null);
    try {
      await equipOrUseItem(employeeNumber, itemId);
      await refreshInventory(employeeNumber);
    } catch (actionError) {
      console.error(actionError);
      setError(actionError instanceof Error ? actionError.message : "Could not apply action.");
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <AppShell title="Inventory" subtitle="Manage equipment, potions, and cosmetics.">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Weapons", category: "weapon" as const },
          { title: "Armor", category: "armor" as const },
          { title: "Potions", category: "potion" as const },
        ].map((section) => (
          <PixelCard key={section.category} title={section.title}>
            <div className="space-y-2">
              {sections[section.category].map((entry) => {
                const item = getItemById(entry.itemId);
                if (!item) {
                  return null;
                }
                return (
                  <div key={entry.itemId} className="pixel-tag flex items-center justify-between gap-2 px-3 py-2">
                    <span>
                      {item.name} x{entry.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAction(entry.itemId)}
                      disabled={busyItemId === entry.itemId}
                      className="pixel-button px-2 py-1 text-sm uppercase disabled:opacity-60"
                    >
                      {busyItemId === entry.itemId ? "..." : item.category === "potion" ? "Use" : "Equip"}
                    </button>
                  </div>
                );
              })}
              {sections[section.category].length === 0 ? <p className="pixel-subtitle">No items owned.</p> : null}
            </div>
          </PixelCard>
        ))}
      </div>

      <PixelCard title="Cosmetics">
        <div className="mb-2 flex gap-2">
          <PlaceholderIcon label="Cosmetic" colorClass="tone-purple" glyph="✨" />
          <PlaceholderIcon label="Avatar" colorClass="tone-blue" glyph="🧙" />
        </div>
        <div className="mb-3">
          <SampleSprite title="Avatar Sprite" toneClass="tone-purple" />
        </div>
        <div className="space-y-2">
          {sections.cosmetic.map((entry) => {
            const item = getItemById(entry.itemId);
            if (!item) {
              return null;
            }
            return (
              <div key={entry.itemId} className="pixel-tag flex items-center justify-between gap-2 px-3 py-2">
                <span>{item.name}</span>
                <button
                  type="button"
                  onClick={() => handleAction(entry.itemId)}
                  disabled={busyItemId === entry.itemId}
                  className="pixel-button px-2 py-1 text-sm uppercase disabled:opacity-60"
                >
                  Equip
                </button>
              </div>
            );
          })}
          {sections.cosmetic.length === 0 ? <p className="pixel-subtitle">No cosmetics owned.</p> : null}
        </div>
      </PixelCard>

      <PixelCard title="Equipped">
        <div className="mb-2 flex gap-2">
          <PlaceholderIcon label="Weapon" colorClass="tone-blue" glyph="⚔️" />
          <PlaceholderIcon label="Armor" colorClass="tone-green" glyph="🛡️" />
        </div>
        <p>Weapon: {player?.equippedWeapon ?? "-"}</p>
        <p>Armor: {player?.equippedArmor ?? "-"}</p>
        <p>Cosmetic: {player?.equippedCosmetic ?? "-"}</p>
        <p>Potion: {player?.activePotion ?? "-"}</p>
      </PixelCard>
      {error ? <p className="text-[#ff7d7d]">{error}</p> : null}
    </AppShell>
  );
}
