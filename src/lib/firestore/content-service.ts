import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Item, Quest, World } from "@/lib/types/game";

function mapDoc<T>(id: string, data: Record<string, unknown>): T {
  return { id, ...(data as T) };
}

export async function getItems(): Promise<Item[]> {
  const snapshot = await getDocs(collection(db, "items"));
  return snapshot.docs.map((docSnapshot) =>
    mapDoc<Item>(docSnapshot.id, docSnapshot.data() as Record<string, unknown>),
  );
}

export async function getWorlds(): Promise<World[]> {
  const snapshot = await getDocs(collection(db, "worlds"));
  return snapshot.docs.map((docSnapshot) =>
    mapDoc<World>(docSnapshot.id, docSnapshot.data() as Record<string, unknown>),
  );
}

export async function getQuests(): Promise<Quest[]> {
  const snapshot = await getDocs(collection(db, "quests"));
  return snapshot.docs.map((docSnapshot) =>
    mapDoc<Quest>(docSnapshot.id, docSnapshot.data() as Record<string, unknown>),
  );
}
