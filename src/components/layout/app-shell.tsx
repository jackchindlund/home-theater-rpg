import type { ReactNode } from "react";
import { AppNav } from "./app-nav";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
      <header className="pixel-panel rounded-md p-4 md:p-5">
        <h1 className="pixel-title text-4xl md:text-5xl">{title}</h1>
        <p className="pixel-subtitle mt-2 text-lg">{subtitle}</p>
      </header>

      <div className="grid flex-1 gap-4 md:grid-cols-[240px_1fr]">
        <aside className="pixel-panel rounded-md p-3 md:p-4">
          <h2 className="pixel-subtitle mb-3 text-base">Navigation</h2>
          <AppNav />
        </aside>

        <main className="space-y-4">{children}</main>
      </div>
    </div>
  );
}
