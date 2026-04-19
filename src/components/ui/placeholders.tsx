import type { ReactNode } from "react";

type PlaceholderIconProps = {
  label: string;
  colorClass: string;
  glyph: ReactNode;
};

export function PlaceholderIcon({ label, colorClass, glyph }: PlaceholderIconProps) {
  return (
    <div className={`pixel-tag inline-flex items-center gap-2 px-2 py-1 ${colorClass}`}>
      <span className="text-base">{glyph}</span>
      <span className="text-xs uppercase">{label}</span>
    </div>
  );
}

type SampleSpriteProps = {
  title: string;
  toneClass: string;
};

export function SampleSprite({ title, toneClass }: SampleSpriteProps) {
  return (
    <div className={`sprite-box ${toneClass}`}>
      <div className="sprite-pixel" />
      <div className="sprite-pixel" />
      <div className="sprite-pixel" />
      <p className="mt-2 text-xs uppercase">{title}</p>
    </div>
  );
}
