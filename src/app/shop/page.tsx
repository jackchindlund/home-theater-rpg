"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PixelCard } from "@/components/layout/pixel-card";
import { PlaceholderIcon, SampleSprite } from "@/components/ui/placeholders";
import { ITEM_CATALOG } from "@/lib/config/items";
import { purchaseItem } from "@/lib/firestore/inventory-service";
import { getPlayerByEmployeeNumber } from "@/lib/firestore/player-service";
import { getActiveEmployeeNumber } from "@/lib/session/player-session";
import type { Item, ItemCategory } from "@/lib/types/game";

const sectionOrder: { category: ItemCategory; title: string }[] = [
  { category: "weapon", title: "Weapons" },
  { category: "armor", title: "Armor" },
  { category: "potion", title: "Potions" },
  { category: "cosmetic", title: "Cosmetics" },
];

export default function ShopPage() {
  const [employeeNumber, setEmployeeNumber] = useState<string | null>(null);
  const [gold, setGold] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlayer() {
      const activeEmployee = getActiveEmployeeNumber();
      setEmployeeNumber(activeEmployee);
      if (!activeEmployee) {
        setError("No active employee found.");
        return;
      }

      try {
        const player = await getPlayerByEmployeeNumber(activeEmployee);
        setGold(player?.gold ?? 0);
      } catch (loadError) {
        console.error(loadError);
        setError("Could not load player gold.");
      }
    }
    void loadPlayer();
  }, []);

  const catalogBySection = useMemo(() => {
    const grouped = new Map<ItemCategory, Item[]>();
    for (const section of sectionOrder) {
      grouped.set(section.category, ITEM_CATALOG.filter((item) => item.category === section.category));
    }
    return grouped;
  }, []);

  async function handleBuy(itemId: string) {
    if (!employeeNumber) {
      setError("No active employee found.");
      return;
    }
    setBusyItemId(itemId);
    setError(null);
    try {
      const updatedPlayer = await purchaseItem(employeeNumber, itemId);
      setGold(updatedPlayer.gold);
    } catch (purchaseError) {
      console.error(purchaseError);
      setError(purchaseError instanceof Error ? purchaseError.message : "Could not complete purchase.");
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <AppShell title="Shop" subtitle="Spend gold on battle gear and style.">
      <PixelCard title="Wallet">
        <div className="mb-2 flex gap-2">
          <PlaceholderIcon label="Gold" colorClass="tone-green" glyph="💰" />
          <PlaceholderIcon label="Shop" colorClass="tone-blue" glyph="🛒" />
        </div>
        <p className="text-xl">Gold: {gold ?? "--"}G</p>
      </PixelCard>
      <div className="grid gap-4 md:grid-cols-2">
        {sectionOrder.map((section) => (
          <PixelCard key={section.category} title={section.title} subtitle="Purchase from catalog">
            <div className="space-y-2">
              <div className="mb-2">
                <SampleSprite title={`${section.title} Icon`} toneClass="tone-blue" />
              </div>
              {(catalogBySection.get(section.category) ?? []).map((item) => (
                <div key={item.id} className="pixel-tag flex items-center justify-between gap-3 px-3 py-2">
                  <div>
                    <p>{item.name}</p>
                    <p className="text-sm text-[#9fb8f5]">{item.cost}G</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBuy(item.id)}
                    disabled={busyItemId === item.id}
                    className="pixel-button px-3 py-1 uppercase disabled:opacity-60"
                  >
                    {busyItemId === item.id ? "..." : "Buy"}
                  </button>
                </div>
              ))}
            </div>
          </PixelCard>
        ))}
      </div>
      {error ? <p className="text-[#ff7d7d]">{error}</p> : null}
    </AppShell>
  );
}
