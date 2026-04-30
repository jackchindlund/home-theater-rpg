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
import { getPeriodKeyForCadence, isProgressStale } from "@/lib/game/quest-periods";
import { applyEnemyDamage, calculateRewards, levelFromXp } from "@/lib/game/progression";
import {
  DEFAULT_APPEARANCE_BODY_ID,
  DEFAULT_APPEARANCE_HAIR_ID,
  isValidBodyId,
  isValidHairId,
} from "@/lib/config/appearance";
import { isApprovedManager } from "@/lib/config/managers";
import type { Player, QuestCadence, QuestProgress, Sale, SaleInput, SaleResult } from "@/lib/types/game";

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

function coerceAppearanceBodyId(raw: unknown): string {
  const s = String(raw ?? "");
  return isValidBodyId(s) ? s : DEFAULT_APPEARANCE_BODY_ID;
}

function coerceAppearanceHairId(raw: unknown): string {
  const s = String(raw ?? "");
  return isValidHairId(s) ? s : DEFAULT_APPEARANCE_HAIR_ID;
}

function mapPlayerFromDoc(id: string, data: Record<string, unknown>): Player {
  return {
    id,
    employeeNumber: String(data.employeeNumber ?? ""),
    displayName: String(data.displayName ?? `Player ${String(data.employeeNumber ?? "")}`),
    appearanceBodyId: coerceAppearanceBodyId(data.appearanceBodyId),
    appearanceHairId: coerceAppearanceHairId(data.appearanceHairId),
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
    appearanceBodyId: DEFAULT_APPEARANCE_BODY_ID,
    appearanceHairId: DEFAULT_APPEARANCE_HAIR_ID,
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

  const docByQuestId = new Map<string, (typeof progressSnapshot.docs)[number]>();
  for (const progressDoc of progressSnapshot.docs) {
    docByQuestId.set(progressDoc.id, progressDoc);
  }

  const now = new Date();

  return QUEST_DEFINITIONS.map((quest) => {
    const progressDoc = docByQuestId.get(quest.id);
    if (!progressDoc) {
      return {
        id: quest.id,
        playerId: player.id,
        questId: quest.id,
        cadence: quest.cadence,
        progress: 0,
        target: quest.target,
        completed: false,
        lastUpdatedAt: new Date().toISOString(),
        periodKey: getPeriodKeyForCadence(quest.cadence, now),
      };
    }

    const data = progressDoc.data() as Record<string, unknown>;
    if (isProgressStale(data, quest.cadence, now)) {
      return {
        id: quest.id,
        playerId: player.id,
        questId: quest.id,
        cadence: quest.cadence,
        progress: 0,
        target: quest.target,
        completed: false,
        lastUpdatedAt: new Date().toISOString(),
        periodKey: getPeriodKeyForCadence(quest.cadence, now),
      };
    }

    return {
      id: progressDoc.id,
      playerId: player.id,
      questId: String(data.questId ?? progressDoc.id),
      cadence: (data.cadence as QuestCadence) ?? quest.cadence,
      progress: Number(data.progress ?? 0),
      target: Number(data.target ?? quest.target),
      completed: Boolean(data.completed),
      lastUpdatedAt: toIsoString(data.lastUpdatedAt),
      periodKey: typeof data.periodKey === "string" ? data.periodKey : getPeriodKeyForCadence(quest.cadence, now),
    };
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

  const saleRef = doc(collection(db, SALES_COLLECTION));
  const playerRef = doc(db, PLAYERS_COLLECTION, player.id);

  const txOutcome = await runTransaction(db, async (transaction) => {
    const now = new Date();
    // Firestore requires all transaction.get() calls before any writes.
    const questProgressCollectionRef = collection(db, PLAYERS_COLLECTION, player.id, QUEST_PROGRESS_COLLECTION);
    const questPlans: {
      quest: (typeof QUEST_DEFINITIONS)[number];
      questProgressRef: ReturnType<typeof doc>;
      currentCompleted: boolean;
      nextProgress: number;
      completed: boolean;
    }[] = [];

    for (const quest of QUEST_DEFINITIONS) {
      const increment = questIncrementForSale(quest.id, input);
      if (increment <= 0) {
        continue;
      }

      const questProgressRef = doc(questProgressCollectionRef, quest.id);
      const progressSnapshot = await transaction.get(questProgressRef);
      const rawData = progressSnapshot.exists() ? (progressSnapshot.data() as Record<string, unknown>) : undefined;
      const stale = isProgressStale(rawData, quest.cadence, now);
      const currentProgress = stale || !rawData ? 0 : Number(rawData.progress ?? 0);
      const currentCompleted = stale || !rawData ? false : Boolean(rawData.completed);
      const nextProgress = Math.min(quest.target, currentProgress + increment);
      const completed = nextProgress >= quest.target;

      questPlans.push({
        quest,
        questProgressRef,
        currentCompleted,
        nextProgress,
        completed,
      });
    }

    let questRewardXp = 0;
    let questRewardGold = 0;
    for (const plan of questPlans) {
      if (!plan.currentCompleted && plan.completed) {
        questRewardXp += plan.quest.rewardXp;
        questRewardGold += plan.quest.rewardGold;
      }
    }

    const totalXp = player.xp + rewards.xpEarned + questRewardXp;
    const totalGold = player.gold + rewards.goldEarned + questRewardGold;
    const nextLevel = levelFromXp(totalXp);

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

    const completedQuestIds: string[] = [];
    for (const plan of questPlans) {
      transaction.set(
        plan.questProgressRef,
        {
          playerId: player.id,
          questId: plan.quest.id,
          cadence: plan.quest.cadence,
          progress: plan.nextProgress,
          target: plan.quest.target,
          completed: plan.completed,
          periodKey: getPeriodKeyForCadence(plan.quest.cadence, now),
          lastUpdatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      if (!plan.currentCompleted && plan.completed) {
        completedQuestIds.push(plan.quest.id);
      }
    }

    return {
      questRewardXp,
      questRewardGold,
      totalXp,
      totalGold,
      nextLevel,
      completedQuestIds,
    };
  });

  return {
    saleId: saleRef.id,
    xpEarned: rewards.xpEarned,
    goldEarned: rewards.goldEarned,
    questRewardXp: txOutcome.questRewardXp,
    questRewardGold: txOutcome.questRewardGold,
    damageDealt: rewards.damageDealt,
    enemyDefeated: enemyProgress.enemyDefeated,
    advancedWorld: enemyProgress.advancedWorld,
    nextEnemyHp: enemyProgress.nextEnemyHp,
    nextEnemyIndex: enemyProgress.nextEnemyIndex,
    nextWorld: enemyProgress.nextWorld,
    nextLevel: txOutcome.nextLevel,
    totalXp: txOutcome.totalXp,
    totalGold: txOutcome.totalGold,
    completedQuestIds: txOutcome.completedQuestIds,
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

export type ProfileUpdate = {
  displayName?: string;
  appearanceBodyId?: string;
  appearanceHairId?: string;
};

export async function updatePlayerProfile(employeeNumber: string, updates: ProfileUpdate): Promise<Player> {
  const player = await getOrCreatePlayerByEmployeeNumber(employeeNumber);
  const playerRef = doc(db, PLAYERS_COLLECTION, player.id);
  const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };

  if (updates.displayName !== undefined) {
    const name = updates.displayName.trim();
    if (name.length < 1 || name.length > 32) {
      throw new Error("Display name must be between 1 and 32 characters.");
    }
    patch.displayName = name;
  }
  if (updates.appearanceBodyId !== undefined) {
    if (!isValidBodyId(updates.appearanceBodyId)) {
      throw new Error("Invalid body selection.");
    }
    patch.appearanceBodyId = updates.appearanceBodyId;
  }
  if (updates.appearanceHairId !== undefined) {
    if (!isValidHairId(updates.appearanceHairId)) {
      throw new Error("Invalid hair selection.");
    }
    patch.appearanceHairId = updates.appearanceHairId;
  }

  if (Object.keys(patch).length <= 1) {
    return player;
  }

  await updateDoc(playerRef, patch);
  const refreshed = await getPlayerByEmployeeNumber(employeeNumber.trim());
  if (!refreshed) {
    throw new Error("Could not reload profile.");
  }
  return refreshed;
}
