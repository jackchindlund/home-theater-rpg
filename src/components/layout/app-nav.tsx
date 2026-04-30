"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { isManagerEmployee } from "@/lib/firestore/player-service";
import { getActiveEmployeeNumber } from "@/lib/session/player-session";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/sale", label: "Made Sale" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/shop", label: "Shop" },
  { href: "/inventory", label: "Inventory" },
  { href: "/map", label: "Map" },
];

export function AppNav() {
  const pathname = usePathname();
  const [showManagerTab, setShowManagerTab] = useState(false);

  useEffect(() => {
    async function checkManager() {
      const employeeNumber = getActiveEmployeeNumber();
      if (!employeeNumber) {
        setShowManagerTab(false);
        return;
      }
      setShowManagerTab(await isManagerEmployee(employeeNumber));
    }
    void checkManager();
  }, []);

  const visibleItems = useMemo(
    () =>
      showManagerTab
        ? [...navItems, { href: "/manager", label: "Manager" }]
        : navItems,
    [showManagerTab],
  );

  return (
    <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`pixel-button px-3 py-2 text-center text-sm uppercase ${
              isActive ? "bg-[#3558ad] text-[#ffd447]" : ""
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
