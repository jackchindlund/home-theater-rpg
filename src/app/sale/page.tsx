"use client";

import { FormEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PixelCard } from "@/components/layout/pixel-card";
import { calculateRewards } from "@/lib/game/progression";
import { submitSaleForEmployee } from "@/lib/firestore/player-service";
import { getActiveEmployeeNumber } from "@/lib/session/player-session";
import type { SaleInput, SaleResult } from "@/lib/types/game";

export default function SalePage() {
  const [formData, setFormData] = useState<SaleInput>({
    tvPrice: 0,
    basketAmount: 0,
    audio: false,
    services: false,
    protection: false,
    membership: false,
    card: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);
  const [damagePopupValue, setDamagePopupValue] = useState<number | null>(null);
  const [showQuestBanner, setShowQuestBanner] = useState(false);
  const [showBattleModal, setShowBattleModal] = useState(false);

  const preview = useMemo(() => calculateRewards(formData), [formData]);

  function updateBooleanField(field: keyof SaleInput) {
    return (checked: boolean) => {
      setFormData((prev) => ({ ...prev, [field]: checked }));
    };
  }

  function updateNumberField(field: "tvPrice" | "basketAmount") {
    return (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: Number(value) || 0 }));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const employeeNumber = getActiveEmployeeNumber();
    if (!employeeNumber) {
      setError("No active employee found. Go back to entry screen first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const submitResult = await submitSaleForEmployee(employeeNumber, formData);
      setResult(submitResult);
      setDamagePopupValue(submitResult.damageDealt);
      setTimeout(() => setDamagePopupValue(null), 900);
      setShowBattleModal(true);
      if (submitResult.completedQuestIds.length > 0) {
        setShowQuestBanner(true);
        setTimeout(() => setShowQuestBanner(false), 2800);
      }
    } catch (submitError) {
      console.error(submitError);
      setError("Could not submit sale. Check Firebase rules/config and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell title="Sale Entry" subtitle="Log one sale at a time.">
      {showQuestBanner && result?.completedQuestIds.length ? (
        <div className="quest-banner px-4 py-2 uppercase">
          Quest Complete: {result.completedQuestIds.join(", ")}
        </div>
      ) : null}
      <PixelCard title="Submit Sale" subtitle="Creates sale doc and updates progression.">
        <div className="relative">
          {damagePopupValue ? <div className="damage-popup text-3xl">-{damagePopupValue} HP</div> : null}
        </div>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-1">
            <span className="pixel-subtitle text-sm">TV Price</span>
            <input
              type="number"
              className="w-full border-3 border-[#5f87e5] bg-[#0c1327] px-3 py-2 outline-none"
              placeholder="0"
              value={formData.tvPrice || ""}
              onChange={(event) => updateNumberField("tvPrice")(event.target.value)}
            />
          </label>

          <label className="space-y-1">
            <span className="pixel-subtitle text-sm">Basket Amount</span>
            <input
              type="number"
              className="w-full border-3 border-[#5f87e5] bg-[#0c1327] px-3 py-2 outline-none"
              placeholder="0"
              value={formData.basketAmount || ""}
              onChange={(event) => updateNumberField("basketAmount")(event.target.value)}
            />
          </label>

          <label className="pixel-tag inline-flex items-center gap-2 px-3 py-2">
            <input type="checkbox" checked={formData.audio} onChange={(event) => updateBooleanField("audio")(event.target.checked)} />
            <span>Audio</span>
          </label>
          <label className="pixel-tag inline-flex items-center gap-2 px-3 py-2">
            <input type="checkbox" checked={formData.services} onChange={(event) => updateBooleanField("services")(event.target.checked)} />
            <span>Services</span>
          </label>
          <label className="pixel-tag inline-flex items-center gap-2 px-3 py-2">
            <input type="checkbox" checked={formData.protection} onChange={(event) => updateBooleanField("protection")(event.target.checked)} />
            <span>Protection</span>
          </label>
          <label className="pixel-tag inline-flex items-center gap-2 px-3 py-2">
            <input type="checkbox" checked={formData.membership} onChange={(event) => updateBooleanField("membership")(event.target.checked)} />
            <span>Membership</span>
          </label>
          <label className="pixel-tag inline-flex items-center gap-2 px-3 py-2">
            <input type="checkbox" checked={formData.card} onChange={(event) => updateBooleanField("card")(event.target.checked)} />
            <span>Card</span>
          </label>

          <div className="pixel-tag md:col-span-2 p-3">
            <p>Preview XP: {preview.xpEarned}</p>
            <p>Preview Gold: {preview.goldEarned}</p>
            <p>Preview Damage: {preview.damageDealt}</p>
          </div>

          <button type="submit" disabled={isSubmitting} className="pixel-button md:col-span-2 px-4 py-2 text-lg uppercase disabled:opacity-60">
            {isSubmitting ? "Submitting..." : "Submit Sale"}
          </button>
        </form>

        {error ? <p className="mt-4 text-[#ff7d7d]">{error}</p> : null}
        {result ? (
          <div className="pixel-tag mt-4 space-y-1 p-3">
            <p>Sale saved: {result.saleId}</p>
            <p>+{result.xpEarned} XP, +{result.goldEarned} Gold, {result.damageDealt} Damage</p>
            <p>
              Enemy {result.enemyDefeated ? "defeated" : "hit"} | World {result.nextWorld} Enemy{" "}
              {result.nextEnemyIndex + 1} HP {result.nextEnemyHp}
            </p>
            {result.completedQuestIds.length > 0 ? (
              <p>Quest completed: {result.completedQuestIds.join(", ")}</p>
            ) : null}
          </div>
        ) : null}
      </PixelCard>
      {showBattleModal && result ? (
        <div className="battle-modal-overlay">
          <div className="pixel-panel w-full max-w-xl rounded-md p-5">
            <h2 className="pixel-title text-2xl">Battle Result</h2>
            <div className="mt-4 space-y-2 text-lg">
              <p>You dealt {result.damageDealt} damage.</p>
              <p>You gained +{result.xpEarned} XP and +{result.goldEarned} Gold.</p>
              <p>
                {result.enemyDefeated ? "Enemy defeated!" : "Enemy survives."} World {result.nextWorld}, Enemy{" "}
                {result.nextEnemyIndex + 1}, HP {result.nextEnemyHp}.
              </p>
              {result.completedQuestIds.length > 0 ? (
                <p className="text-[#7aff9d]">Quest completed: {result.completedQuestIds.join(", ")}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="pixel-button mt-5 px-4 py-2 uppercase"
              onClick={() => setShowBattleModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
