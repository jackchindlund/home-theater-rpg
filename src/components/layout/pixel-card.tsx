import type { ReactNode } from "react";

type PixelCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function PixelCard({ title, subtitle, children }: PixelCardProps) {
  return (
    <section className="pixel-panel rounded-md p-4">
      <h2 className="pixel-title text-2xl">{title}</h2>
      {subtitle ? <p className="pixel-subtitle mt-1 text-base">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
