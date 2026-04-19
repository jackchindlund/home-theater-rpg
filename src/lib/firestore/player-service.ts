import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getWorldByIndex } from "@/lib/config/worlds";
import { QUEST_DEFINITIONS, questIncrementForSale } from "@/lib/config/quests";
import { applyEnemyDamage, calculateRewards, levelFromXp } from "@/lib/game/progression";
import { isApprovedManager } from "@/lib/config/managers";
import type { Player, QuestProgress, Sale, SaleInput, SaleResult } from "@/lib/types/game";

const PLAYERS_COLLECTION = "players";
const SALES_COLLECTION = "sales";
const QUEST_PROGRESS_COLLECTION = "questProgress";

function toIsoString(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}

function mapPlayerFromDoc(id: string, data: Record<string, unknown>): Player {
  return {
    id,
    employeeNumber: String(data.employeeNumber ?? ""),
    displayName: String(data.displayName ?? `Player ${String(data.employeeNumber ?? "")}`),
    level: Number(data.level ?? 1),
    xp: Number(data.xp ?? 0),
    gold: Number(data.gold ?? 0),
    equippedWeapon: (data.equippedWeapon as string | null) ?? null,
    equippedArmor: (data.equippedArmor as string | null) ?? null,
    equippedCosmetic: (data.equippedCosmetic as string | null) ?? null,
    activePotion: (data.activePotion as string | null) ?? null,
    activePotionExpiresAt: (data.activePotionExpiresAt as string | null) ?? null,
    currentWorld: Number(data.currentWorld ?? 1),
    currentEnemyIndex: Number(data.currentEnemyIndex ?? 0),
    currentEnemyHp: Number(data.currentEnemyHp ?? getWorldByIndex(1).enemies[0].hp),
    bossesCleared: Number(data.bossesCleared ?? 0),
    totalSales: Number(data.totalSales ?? 0),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

function defaultPlayer(employeeNumber: string): Omit<Player, "id"> {
  return {
    employeeNumber,
    displayName: `Player ${employeeNumber}`,
    level: 1,
    xp: 0,
    gold: 0,
    equippedWeapon: null,
    equippedArmor: null,
    equippedCosmetic: null,
    activePotion: null,
    activePotionExpiresAt: null,
    currentWorld: 1,
    currentEnemyIndex: 0,
    currentEnemyHp: getWorldByIndex(1).enemies[0].hp,
    bossesCleared: 0,
    totalSales: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getPlayerByEmployeeNumber(employeeNumber: string): Promise<Player | null> {
  const playersRef = collection(db, PLAYERS_COLLECTION);
  const playerQuery = query(playersRef, where("employeeNumber", "==", employeeNumber), limit(1));
  const snapshot = await getDocs(playerQuery);

  if (snapshot.empty) {
    return null;
  }

  const playerDoc = snapshot.docs[0];
  return mapPlayerFromDoc(playerDoc.id, playerDoc.data());
}

export async function getLeaderboardPlayers(maxRows = 50): Promise<Player[]> {
  const playersRef = collection(db, PLAYERS_COLLECTION);
  const leaderboardQuery = query(playersRef, orderBy("level", "desc"), orderBy("xp", "desc"), limit(maxRows));
  const snapshot = await getDocs(leaderboardQuery);
  return snapshot.docs.map((playerDoc) => mapPlayerFromDoc(playerDoc.id, playerDoc.data()));
}

export async function getQuestProgressForEmployee(employeeNumber: string): Promise<QuestProgress[]> {
  const player = await getOrCreatePlayerByEmployeeNumber(employeeNumber);
  const progressSnapshot = await getDocs(
    collection(db, PLAYERS_COLLECTION, player.id, QUEST_PROGRESS_COLLECTION),
  );

  const progressByQuestId = new Map<string, QuestProgress>();
  for (const progressDoc of progressSnapshot.docs) {
    progressByQuestId.set(progressDoc.id, {
      id: progressDoc.id,
      playerId: player.id,
      questId: String(progressDoc.data().questId ?? progressDoc.id),
      cadence: (progressDoc.data().cadence as "daily" | "weekly") ?? "daily",
      progress: Number(progressDoc.data().progress ?? 0),
      target: Number(progressDoc.data().target ?? 1),
      completed: Boolean(progressDoc.data().completed),
      lastUpdatedAt: toIsoString(progressDoc.data().lastUpdatedAt),
    });
  }

  return QUEST_DEFINITIONS.map((quest) => {
    const existing = progressByQuestId.get(quest.id);
    return (
      existing ?? {
        id: quest.id,
        playerId: player.id,
        questId: quest.id,
        cadence: quest.cadence,
        progress: 0,
        target: quest.target,
        completed: false,
        lastUpdatedAt: new Date().toISOString(),
      }
    );
  });
}

export async function getOrCreatePlayerByEmployeeNumber(employeeNumber: string): Promise<Player> {
  const trimmedEmployeeNumber = employeeNumber.trim();
  const existing = await getPlayerByEmployeeNumber(trimmedEmployeeNumber);

  if (existing) {
    return existing;
  }

  const nowIso = new Date().toISOString();
  const playerPayload = {
    ...defaultPlayer(trimmedEmployeeNumber),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const playerRef = doc(collection(db, PLAYERS_COLLECTION));
  await runTransaction(db, async (transaction) => {
    transaction.set(playerRef, { ...playerPayload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });

  const createdDoc = await getDoc(playerRef);
  if (!createdDoc.exists()) {
    throw new Error("Failed to create player.");
  }

  return mapPlayerFromDoc(createdDoc.id, createdDoc.data());
}

export async function submitSaleForEmployee(
  employeeNumber: string,
  input: SaleInput,
): Promise<SaleResult> {
  const player = await getOrCreatePlayerByEmployeeNumber(employeeNumber);
  const rewards = calculateRewards(input);
  const enemyProgress = applyEnemyDamage(player, rewards.damageDealt);

  const totalXp = player.xp + rewards.xpEarned;
  const totalGold = player.gold + rewards.goldEarned;
  const nextLevel = levelFromXp(totalXp);

  const saleRef = doc(collection(db, SALES_COLLECTION));
  const playerRef = doc(db, PLAYERS_COLLECTION, player.id);

  const completedQuestIds: string[] = [];
  await runTransaction(db, async (transaction) => {
    transaction.set(saleRef, {
      playerId: player.id,
      tvPrice: input.tvPrice,
      basketAmount: input.basketAmount,
      audio: input.audio,
      services: input.services,
      protection: input.protection,
      membership: input.membership,
      card: input.card,
      xpEarned: rewards.xpEarned,
      goldEarned: rewards.goldEarned,
      damageDealt: rewards.damageDealt,
      createdAt: serverTimestamp(),
    });

    transaction.update(playerRef, {
      xp: totalXp,
      gold: totalGold,
      level: nextLevel,
      totalSales: player.totalSales + 1,
      currentWorld: enemyProgress.nextWorld,
      currentEnemyIndex: enemyProgress.nextEnemyIndex,
      currentEnemyHp: enemyProgress.nextEnemyHp,
      bossesCleared: enemyProgress.nextBossesCleared,
      updatedAt: serverTimestamp(),
    });

    const questProgressCollectionRef = collection(db, PLAYERS_COLLECTION, player.id, QUEST_PROGRESS_COLLECTION);
    for (const quest of QUEST_DEFINITIONS) {
      const increment = questIncrementForSale(quest.id, input);
      if (increment <= 0) {
        continue;
      }

      const questProgressRef = doc(questProgressCollectionRef, quest.id);
      const progressSnapshot = await transaction.get(questProgressRef);
      const currentProgress = progressSnapshot.exists() ? Number(progressSnapshot.data().progress ?? 0) : 0;
      const currentCompleted = progressSnapshot.exists()
        ? Boolean(progressSnapshot.data().completed)
        : false;
      const nextProgress = Math.min(quest.target, currentProgress + increment);
      const completed = nextProgress >= quest.target;

      transaction.set(
        questProgressRef,
        {
          playerId: player.id,
          questId: quest.id,
          cadence: quest.cadence,
          progress: nextProgress,
          target: quest.target,
          completed,
          lastUpdatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      if (!currentCompleted && completed) {
        completedQuestIds.push(quest.id);
      }
    }
  });

  return {
    saleId: saleRef.id,
    xpEarned: rewards.xpEarned,
    goldEarned: rewards.goldEarned,
    damageDealt: rewards.damageDealt,
    enemyDefeated: enemyProgress.enemyDefeated,
    advancedWorld: enemyProgress.advancedWorld,
    nextEnemyHp: enemyProgress.nextEnemyHp,
    nextEnemyIndex: enemyProgress.nextEnemyIndex,
    nextWorld: enemyProgress.nextWorld,
    nextLevel,
    totalXp,
    totalGold,
    completedQuestIds,
  };
}

export async function isManagerEmployee(employeeNumber: string): Promise<boolean> {
  return isApprovedManager(employeeNumber);
}

export async function getRecentSales(maxRows = 30): Promise<Sale[]> {
  const salesRef = collection(db, SALES_COLLECTION);
  const salesQuery = query(salesRef, orderBy("createdAt", "desc"), limit(maxRows));
  const snapshot = await getDocs(salesQuery);
  return snapshot.docs.map((saleDoc) => ({
    id: saleDoc.id,
    playerId: String(saleDoc.data().playerId ?? ""),
    tvPrice: Number(saleDoc.data().tvPrice ?? 0),
    basketAmount: Number(saleDoc.data().basketAmount ?? 0),
    audio: Boolean(saleDoc.data().audio),
    services: Boolean(saleDoc.data().services),
    protection: Boolean(saleDoc.data().protection),
    membership: Boolean(saleDoc.data().membership),
    card: Boolean(saleDoc.data().card),
    xpEarned: Number(saleDoc.data().xpEarned ?? 0),
    goldEarned: Number(saleDoc.data().goldEarned ?? 0),
    damageDealt: Number(saleDoc.data().damageDealt ?? 0),
    createdAt: toIsoString(saleDoc.data().createdAt),
  }));
}

export async function deleteSaleById(saleId: string): Promise<void> {
  await deleteDoc(doc(db, SALES_COLLECTION, saleId));
}

export async function addGoldToEmployee(employeeNumber: string, goldToAdd: number): Promise<Player> {
  const player = await getOrCreatePlayerByEmployeeNumber(employeeNumber);
  const playerRef = doc(db, PLAYERS_COLLECTION, player.id);

  await updateDoc(playerRef, {
    gold: player.gold + Math.max(0, goldToAdd),
    updatedAt: serverTimestamp(),
  });

  return getOrCreatePlayerByEmployeeNumber(employeeNumber);
}
