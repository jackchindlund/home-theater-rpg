import type { Quest, SaleInput } from "@/lib/types/game";

export const QUEST_DEFINITIONS: Quest[] = [
  {
    id: "daily-enter-2-sales",
    title: "Close 2 Sales",
    cadence: "daily",
    description: "Enter two sales today.",
    target: 2,
    rewardXp: 40,
    rewardGold: 20,
  },
  {
    id: "daily-audio-attach",
    title: "Audio Attach",
    cadence: "daily",
    description: "Get 1 audio attach.",
    target: 1,
    rewardXp: 25,
    rewardGold: 10,
  },
  {
    id: "weekly-services-3",
    title: "Service Specialist",
    cadence: "weekly",
    description: "Get 3 services this week.",
    target: 3,
    rewardXp: 90,
    rewardGold: 60,
  },
  {
    id: "weekly-enter-8-sales",
    title: "Sales Marathon",
    cadence: "weekly",
    description: "Enter 8 sales this week.",
    target: 8,
    rewardXp: 120,
    rewardGold: 80,
  },
];

export function questIncrementForSale(questId: string, sale: SaleInput): number {
  switch (questId) {
    case "daily-enter-2-sales":
    case "weekly-enter-8-sales":
      return 1;
    case "daily-audio-attach":
      return sale.audio ? 1 : 0;
    case "weekly-services-3":
      return sale.services ? 1 : 0;
    default:
      return 0;
  }
}
