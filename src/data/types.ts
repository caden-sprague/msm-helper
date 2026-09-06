// Mirrors the JSON in this directory. See docs/DATA-MODEL.md.

export type ElementFamily = 'natural' | 'ethereal' | 'other';

export type ElementId =
  // natural
  | 'plant' | 'cold' | 'air' | 'water' | 'earth'
  // ethereal            [verify] before any ethereal data is entered
  | 'crystal' | 'fire' | 'plasma' | 'shadow' | 'mech'
  // other               [verify]
  | 'poison' | 'light' | 'psychic' | 'faerie' | 'bone';

export interface Element {
  id: ElementId;
  name: string;
  family: ElementFamily;
  color: string;
}

// A hand-maintained union. Adding an island: one line here, one row in islands.json.
export type IslandId = 'plant' | 'cold' | 'air' | 'water' | 'earth' | 'shugabush';

export interface Island {
  id: IslandId;
  name: string;
  order: number;
  color: string;
  /** Elements that exist on this island. Constrains which monsters can live here. */
  elements: ElementId[];
}

export type Rarity = 'common' | 'rare' | 'epic';

export interface Monster {
  id: string;
  name: string;
  rarity: Rarity;
  variantOf?: string;
  elements: ElementId[];
  islands: IslandId[];
  /** ISO 8601 duration, e.g. "PT8H". Omitted when not yet verified. */
  breedingTime?: string;
  buyable: boolean;
  icon?: string;
  /** True only once a human has checked this row against the game or wiki. */
  verified: boolean;
}

export interface Combo {
  target: string;
  parents: [string, string];
  islands?: IslandId[];
  followsElementRule: boolean;
  /** Required when followsElementRule is false. */
  note?: string;
  verified: boolean;
}
