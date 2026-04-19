import { collection, doc, getDocs, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getItemById } from "@/lib/config/items";
import { getOrCreatePlayerByEmployeeNumber } from "@/lib/firestore/player-service";
import type { InventoryEntry, Player } from "@/lib/types/game";

const PLAYERS_COLLECTION = "players";

function inventoryCollection(playerId: string) {
  return collection(db, PLAYERS_COLLECTION, playerId, "inventory");
}

export async function getInventoryForEmployee(employeeNumber: string): Promise<InventoryEntry[]> {
  const player = await getOrCreatePlayerByEmployeeNumber(employeeNumber);
  const snapshot = await getDocs(inventoryCollection(player.id));
  return snapshot.docs.map((entry) => ({
    itemId: entry.id,
    quantity: Number(entry.data().quantity ?? 0),
    obtainedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export async function purchaseItem(employeeNumber: string, itemId: string): Promise<Player> {
  const item = getItemById(itemId);
  if (!item) {
    throw new Error("Unknown item.");
  }

  const player = await getOrCreatePlayerByEmployeeNumber(employeeNumber);
  const playerRef = doc(db, PLAYERS_COLLECTION, player.id);
  const inventoryRef = doc(db, PLAYERS_COLLECTION, player.id, "inventory", itemId);

  await runTransaction(db, async (transaction) => {
    const playerSnapshot = await transaction.get(playerRef);
    if (!playerSnapshot.exists()) {
      throw new Error("Player not found.");
    }
    const currentGold = Number(playerSnapshot.data().gold ?? 0);
    if (currentGold < item.cost) {
      throw new Error("Not enough gold.");
    }

    const inventorySnapshot = await transaction.get(inventoryRef);
    const currentQuantity = inventorySnapshot.exists() ? Number(inventorySnapshot.data().quantity ?? 0) : 0;

    transaction.set(
      inventoryRef,
      {
        quantity: currentQuantity + 1,
        obtainedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    transaction.update(playerRef, {
      gold: currentGold - item.cost,
      updatedAt: serverTimestamp(),
    });
  });

  return getOrCreatePlayerByEmployeeNumber(employeeNumber);
}

export async function equipOrUseItem(employeeNumber: string, itemId: string): Promise<Player> {
  const item = getItemById(itemId);
  if (!item) {
    throw new Error("Unknown item.");
  }

  const player = await getOrCreatePlayerByEmployeeNumber(employeeNumber);
  const playerRef = doc(db, PLAYERS_COLLECTION, player.id);
  const inventoryRef = doc(db, PLAYERS_COLLECTION, player.id, "inventory", itemId);

  await runTransaction(db, async (transaction) => {
    const inventorySnapshot = await transaction.get(inventoryRef);
    const quantity = inventorySnapshot.exists() ? Number(inventorySnapshot.data().quantity ?? 0) : 0;
    if (quantity <= 0) {
      throw new Error("Item not owned.");
    }

    if (item.category === "weapon") {
      transaction.update(playerRef, { equippedWeapon: itemId, updatedAt: serverTimestamp() });
      return;
    }
    if (item.category === "armor") {
      transaction.update(playerRef, { equippedArmor: itemId, updatedAt: serverTimestamp() });
      return;
    }
    if (item.category === "cosmetic") {
      transaction.update(playerRef, { equippedCosmetic: itemId, updatedAt: serverTimestamp() });
      return;
    }

    const potionExpiry = new Date();
    potionExpiry.setHours(23, 59, 59, 999);
    transaction.update(playerRef, {
      activePotion: itemId,
      activePotionExpiresAt: potionExpiry.toISOString(),
      updatedAt: serverTimestamp(),
    });
    transaction.update(inventoryRef, {
      quantity: quantity - 1,
      updatedAt: serverTimestamp(),
    });
  });

  return getOrCreatePlayerByEmployeeNumber(employeeNumber);
}
