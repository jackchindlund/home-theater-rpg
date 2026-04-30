"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PixelCard } from "@/components/layout/pixel-card";
import { ItemIcon } from "@/components/game/item-icon";
import { PlayerAvatar } from "@/components/game/player-avatar";
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
    <AppShell title="Inventory" subtitle="Equipment matches your paper-doll avatar everywhere.">
      {player ? (
        <PixelCard title="Your hero" subtitle={player.displayName}>
          <div className="flex flex-wrap items-center gap-6">
            <PlayerAvatar player={player} size={96} className="ring-2 ring-[#5f87e5]/50" />
            <p className="text-sm text-[#9fb8f5]">
              Change body & hair on{" "}
              <Link href="/profile" className="text-[#ffd447] underline underline-offset-2">
                Profile
              </Link>
              .
            </p>
          </div>
        </PixelCard>
      ) : null}

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
                    <span className="flex min-w-0 items-center gap-2">
                      <ItemIcon itemId={item.id} size={36} title={item.name} />
                      <span className="truncate">
                        {item.name} x{entry.quantity}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAction(entry.itemId)}
                      disabled={busyItemId === entry.itemId}
                      className="pixel-button shrink-0 px-2 py-1 text-sm uppercase disabled:opacity-60"
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
        <div className="space-y-2">
          {sections.cosmetic.map((entry) => {
            const item = getItemById(entry.itemId);
            if (!item) {
              return null;
            }
            return (
              <div key={entry.itemId} className="pixel-tag flex items-center justify-between gap-2 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <ItemIcon itemId={item.id} size={36} title={item.name} />
                  <span className="truncate">{item.name}</span>
                </span>
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

      <PixelCard title="Equipped loadout">
        {player ? (
          <div className="flex flex-wrap items-start gap-6">
            <PlayerAvatar player={player} size={72} />
            <div className="space-y-2 text-sm">
              <EquippedRow label="Weapon" itemId={player.equippedWeapon} />
              <EquippedRow label="Armor" itemId={player.equippedArmor} />
              <EquippedRow label="Cosmetic" itemId={player.equippedCosmetic} />
              <p>
                <span className="text-[#9fb8f5]">Potion: </span>
                {player.activePotion ? getItemById(player.activePotion)?.name ?? player.activePotion : "—"}
              </p>
            </div>
          </div>
        ) : (
          <p className="pixel-subtitle">Loading...</p>
        )}
      </PixelCard>
      {error ? <p className="text-[#ff7d7d]">{error}</p> : null}
    </AppShell>
  );
}

function EquippedRow({ label, itemId }: { label: string; itemId: string | null }) {
  const item = itemId ? getItemById(itemId) : null;
  return (
    <div className="flex items-center gap-2">
      {itemId ? <ItemIcon itemId={itemId} size={28} title={item?.name} /> : <span className="inline-block w-7" />}
      <span className="text-[#9fb8f5]">{label}: </span>
      <span>{item?.name ?? "—"}</span>
    </div>
  );
}
