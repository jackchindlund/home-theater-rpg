/** Allowed paper-doll body bases — filenames: `public/sprites/avatar/bodies/{id}.png` */
export const APPEARANCE_BODIES = [
  { id: "body-01", label: "Body A" },
  { id: "body-02", label: "Body B" },
  { id: "body-03", label: "Body C" },
  { id: "body-04", label: "Body D" },
] as const;

/** Allowed hair layers — `public/sprites/avatar/hair/{id}.png` */
export const APPEARANCE_HAIR = [
  { id: "hair-01", label: "Hair A" },
  { id: "hair-02", label: "Hair B" },
  { id: "hair-03", label: "Hair C" },
  { id: "hair-04", label: "Hair D" },
] as const;

export const DEFAULT_APPEARANCE_BODY_ID = APPEARANCE_BODIES[0].id;
export const DEFAULT_APPEARANCE_HAIR_ID = APPEARANCE_HAIR[0].id;

export type AppearanceBodyId = (typeof APPEARANCE_BODIES)[number]["id"];
export type AppearanceHairId = (typeof APPEARANCE_HAIR)[number]["id"];

export function isValidBodyId(id: string): id is AppearanceBodyId {
  return APPEARANCE_BODIES.some((b) => b.id === id);
}

export function isValidHairId(id: string): id is AppearanceHairId {
  return APPEARANCE_HAIR.some((h) => h.id === id);
}
