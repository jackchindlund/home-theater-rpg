"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PixelCard } from "@/components/layout/pixel-card";
import {
  addGoldToEmployee,
  deleteSaleById,
  getRecentSales,
  isManagerEmployee,
} from "@/lib/firestore/player-service";
import { getActiveEmployeeNumber } from "@/lib/session/player-session";
import type { Sale } from "@/lib/types/game";

export default function ManagerPage() {
  const [authorized, setAuthorized] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [targetEmployeeNumber, setTargetEmployeeNumber] = useState("");
  const [goldAmount, setGoldAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function loadSales() {
    setSales(await getRecentSales());
  }

  useEffect(() => {
    async function loadManagerData() {
      const employeeNumber = getActiveEmployeeNumber();
      if (!employeeNumber || !(await isManagerEmployee(employeeNumber))) {
        setAuthorized(false);
        return;
      }
      setAuthorized(true);
      try {
        await loadSales();
      } catch (loadError) {
        console.error(loadError);
        setError("Could not load manager data.");
      }
    }
    void loadManagerData();
  }, []);

  async function handleDeleteSale(saleId: string) {
    try {
      setError(null);
      setStatus(null);
      await deleteSaleById(saleId);
      await loadSales();
      setStatus("Sale deleted.");
    } catch (deleteError) {
      console.error(deleteError);
      setError("Could not delete sale.");
    }
  }

  async function handleAddGold(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setError(null);
      setStatus(null);
      await addGoldToEmployee(targetEmployeeNumber.trim(), Math.max(0, goldAmount));
      setStatus("Gold awarded.");
      setTargetEmployeeNumber("");
      setGoldAmount(0);
    } catch (addError) {
      console.error(addError);
      setError("Could not add gold.");
    }
  }

  if (!authorized) {
    return (
      <AppShell title="Manager Panel" subtitle="Admin-only tools">
        <PixelCard title="Access Denied">
          <p className="text-[#ff7d7d]">Your employee number is not on the approved manager list.</p>
        </PixelCard>
      </AppShell>
    );
  }

  return (
    <AppShell title="Manager Panel" subtitle="Admin-only tools">
      <div className="grid gap-4 md:grid-cols-2">
        <PixelCard title="Recent Sales">
          <div className="space-y-2">
            {sales.map((sale) => (
              <div key={sale.id} className="pixel-tag flex items-center justify-between gap-3 px-3 py-2">
                <div>
                  <p className="text-sm">Sale {sale.id.slice(0, 8)}</p>
                  <p className="text-sm text-[#9fb8f5]">
                    TV ${sale.tvPrice} | Basket ${sale.basketAmount} | +{sale.goldEarned}G
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSale(sale.id)}
                  className="pixel-button border-[#ff7d7d] px-2 py-1 text-sm uppercase"
                >
                  Delete
                </button>
              </div>
            ))}
            {sales.length === 0 ? <p className="pixel-subtitle">No sales found.</p> : null}
          </div>
        </PixelCard>

        <PixelCard title="Award Gold">
          <form className="space-y-3" onSubmit={handleAddGold}>
            <input
              type="text"
              placeholder="Employee Number"
              value={targetEmployeeNumber}
              onChange={(event) => setTargetEmployeeNumber(event.target.value)}
              className="w-full border-3 border-[#5f87e5] bg-[#0c1327] px-3 py-2 outline-none"
            />
            <input
              type="number"
              placeholder="Gold Amount"
              value={goldAmount || ""}
              onChange={(event) => setGoldAmount(Number(event.target.value) || 0)}
              className="w-full border-3 border-[#5f87e5] bg-[#0c1327] px-3 py-2 outline-none"
            />
            <button type="submit" className="pixel-button px-3 py-2 uppercase">
              Add Gold
            </button>
          </form>
        </PixelCard>
      </div>
      {error ? <p className="text-[#ff7d7d]">{error}</p> : null}
      {status ? <p className="text-[#7aff9d]">{status}</p> : null}
    </AppShell>
  );
}
