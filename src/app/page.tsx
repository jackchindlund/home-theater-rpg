"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PixelCard } from "@/components/layout/pixel-card";
import { getOrCreatePlayerByEmployeeNumber } from "@/lib/firestore/player-service";
import { setActiveEmployeeNumber } from "@/lib/session/player-session";

export default function Home() {
  const router = useRouter();
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = employeeNumber.trim();
    if (!trimmed) {
      setError("Enter a valid employee number.");
      return;
    }

    setIsLoading(true);
    try {
      await getOrCreatePlayerByEmployeeNumber(trimmed);
      setActiveEmployeeNumber(trimmed);
      router.push("/dashboard");
    } catch (submitError) {
      console.error(submitError);
      setError("Could not load player profile. Check Firebase connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center p-4">
      <PixelCard title="Home Theater RPG" subtitle="Employee Number Entry">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-lg uppercase text-[#c4d6ff]" htmlFor="employee-number">
            Employee Number
          </label>
          <input
            id="employee-number"
            type="text"
            placeholder="e.g. 102938"
            value={employeeNumber}
            onChange={(event) => setEmployeeNumber(event.target.value)}
            className="w-full border-3 border-[#5f87e5] bg-[#0c1327] px-3 py-2 text-xl outline-none focus:border-[#ffd447]"
          />
          {error ? <p className="text-sm text-[#ff7d7d]">{error}</p> : null}
          <button type="submit" disabled={isLoading} className="pixel-button px-4 py-2 text-lg uppercase disabled:opacity-60">
            {isLoading ? "Entering..." : "Enter Game"}
          </button>
        </form>
      </PixelCard>
    </main>
  );
}
