import { AppShell } from "@/components/layout/app-shell";
import { PixelCard } from "@/components/layout/pixel-card";
import { PlaceholderIcon, SampleSprite } from "@/components/ui/placeholders";

const worlds = ["World 1", "World 2", "World 3", "World 4", "World 5"];

export default function MapPage() {
  return (
    <AppShell title="Map" subtitle="Track seasonal progression and boss clears.">
      <PixelCard title="World Path" subtitle="Retro node map placeholder">
        <div className="mb-3 flex gap-2">
          <PlaceholderIcon label="Unlocked" colorClass="tone-green" glyph="🟢" />
          <PlaceholderIcon label="Locked" colorClass="tone-purple" glyph="🟣" />
          <PlaceholderIcon label="Boss" colorClass="tone-blue" glyph="👹" />
        </div>
        <div className="mb-3">
          <SampleSprite title="Map Node Sprite" toneClass="tone-blue" />
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {worlds.map((world, index) => (
            <div key={world} className="pixel-tag p-3 text-center">
              <p>{world}</p>
              <p className="mt-1 text-sm text-[#9fb8f5]">{index === 0 ? "Unlocked" : "Locked"}</p>
            </div>
          ))}
        </div>
      </PixelCard>
    </AppShell>
  );
}
