import { getWorldByIndex } from "@/lib/config/worlds";
import type { Player, SaleInput } from "@/lib/types/game";

type Reward = {
  xpEarned: number;
  goldEarned: number;
  damageDealt: number;
};

type EnemyProgress = {
  enemyDefeated: boolean;
  advancedWorld: boolean;
  nextEnemyHp: number;
  nextEnemyIndex: number;
  nextWorld: number;
  nextBossesCleared: number;
};

export function calculateRewards(input: SaleInput): Reward {
  const xpEarned =
    20 +
    Math.floor(input.tvPrice / 50) +
    Math.floor(input.basketAmount / 100) +
    (input.audio ? 10 : 0) +
    (input.services ? 15 : 0) +
    (input.protection ? 8 : 0) +
    (input.membership ? 12 : 0) +
    (input.card ? 15 : 0);

  const goldEarned =
    10 +
    Math.floor(input.tvPrice / 200) +
    Math.floor(input.basketAmount / 150) +
    (input.audio ? 4 : 0) +
    (input.services ? 6 : 0) +
    (input.protection ? 3 : 0) +
    (input.membership ? 5 : 0) +
    (input.card ? 6 : 0);

  const damageDealt =
    10 +
    Math.floor(input.tvPrice / 200) +
    Math.floor(input.basketAmount / 150) +
    (input.audio ? 8 : 0) +
    (input.services ? 12 : 0) +
    (input.protection ? 5 : 0) +
    (input.membership ? 10 : 0) +
    (input.card ? 12 : 0);

  return { xpEarned, goldEarned, damageDealt };
}

export function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / 100) + 1;
}

export function applyEnemyDamage(player: Player, damageDealt: number): EnemyProgress {
  const currentWorld = getWorldByIndex(player.currentWorld);
  const currentEnemy = currentWorld.enemies[player.currentEnemyIndex];

  if (!currentEnemy) {
    const firstEnemy = currentWorld.enemies[0];
    return {
      enemyDefeated: false,
      advancedWorld: false,
      nextEnemyHp: firstEnemy.hp,
      nextEnemyIndex: 0,
      nextWorld: player.currentWorld,
      nextBossesCleared: player.bossesCleared,
    };
  }

  const hpAfterHit = Math.max(0, player.currentEnemyHp - damageDealt);
  const enemyDefeated = hpAfterHit <= 0;

  if (!enemyDefeated) {
    return {
      enemyDefeated: false,
      advancedWorld: false,
      nextEnemyHp: hpAfterHit,
      nextEnemyIndex: player.currentEnemyIndex,
      nextWorld: player.currentWorld,
      nextBossesCleared: player.bossesCleared,
    };
  }

  const defeatedBoss = currentEnemy.isBoss;
  const isFinalEnemyInWorld = player.currentEnemyIndex >= currentWorld.enemies.length - 1;

  if (defeatedBoss && isFinalEnemyInWorld && player.currentWorld < 5) {
    const nextWorld = getWorldByIndex(player.currentWorld + 1);
    return {
      enemyDefeated: true,
      advancedWorld: true,
      nextEnemyHp: nextWorld.enemies[0].hp,
      nextEnemyIndex: 0,
      nextWorld: player.currentWorld + 1,
      nextBossesCleared: player.bossesCleared + 1,
    };
  }

  if (isFinalEnemyInWorld) {
    return {
      enemyDefeated: true,
      advancedWorld: false,
      nextEnemyHp: currentEnemy.hp,
      nextEnemyIndex: player.currentEnemyIndex,
      nextWorld: player.currentWorld,
      nextBossesCleared: defeatedBoss ? player.bossesCleared + 1 : player.bossesCleared,
    };
  }

  const nextEnemy = currentWorld.enemies[player.currentEnemyIndex + 1];
  return {
    enemyDefeated: true,
    advancedWorld: false,
    nextEnemyHp: nextEnemy.hp,
    nextEnemyIndex: player.currentEnemyIndex + 1,
    nextWorld: player.currentWorld,
    nextBossesCleared: player.bossesCleared,
  };
}
