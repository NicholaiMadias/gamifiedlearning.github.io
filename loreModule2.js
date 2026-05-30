/**
 * loreModule2.js — V2 Lore Fragment Library
 * 21 fragments: 6 element-based, 7 star/constellation, 8 conscience/moral.
 * (c) 2026 NicholaiMadias — MIT License
 */

export const LORE_FRAGMENTS = [
  { id: 'lore-radiant-1', element: 'radiant', title: 'The First Light',
    text: 'Before the stars were named, radiance was the language of creation.' },
  { id: 'lore-tide-1', element: 'tide', title: 'The Flowing Mind',
    text: 'Wisdom runs like water — carving canyons where none existed.' },
  { id: 'lore-verdant-1', element: 'verdant', title: 'The Root Network',
    text: 'Community is the mycelium beneath: unseen, essential, binding all.' },
  { id: 'lore-forge-1', element: 'forge', title: 'The Tempered Will',
    text: 'Integrity is not given; it is hammered out in the heat of consequence.' },
  { id: 'lore-aether-1', element: 'aether', title: 'The Sky Between Skies',
    text: 'Between thought and action lies aether — the space where choice is made.' },
  { id: 'lore-umbra-1', element: 'umbra', title: 'The Necessary Shadow',
    text: 'Umbra is not darkness but depth — the dimension that gives light its meaning.' },
  { id: 'lore-star-1', constellation: 'solaris', title: 'Omen of Solaris',
    text: 'The star of warmth rises when hearts align.' },
  { id: 'lore-star-2', constellation: 'tidemere', title: 'Omen of Tidemere',
    text: 'The flowing star descends when wisdom fills the tidal pools of the mind.' },
  { id: 'lore-star-3', constellation: 'verdaxis', title: 'Omen of Verdaxis',
    text: 'The green star blossoms when community is rooted.' },
  { id: 'lore-star-4', constellation: 'forgion', title: 'Omen of Forgion',
    text: 'The forge star ignites when integrity is tested and holds.' },
  { id: 'lore-star-5', constellation: 'aethelon', title: 'Omen of Aethelon',
    text: 'The sky star appears only to those who pause between thought and deed.' },
  { id: 'lore-star-6', constellation: 'umbraxis', title: 'Omen of Umbraxis',
    text: 'The shadow star reveals that all illuminated things cast a shape.' },
  { id: 'lore-star-7', constellation: 'voidheart', title: 'Omen of the Void',
    text: 'The seventh star is all and none — the wild card that rewrites the sky.' },
  { id: 'lore-karma-1', stat: 'karma', threshold: 25, title: 'The Karma Awakens',
    text: 'Each act of radiance ripples outward — what you send returns as starlight.' },
  { id: 'lore-karma-2', stat: 'karma', threshold: 75, title: 'The Karma Crests',
    text: 'The lattice sings with your name when karma reaches full resonance.' },
  { id: 'lore-wisdom-1', stat: 'wisdom', threshold: 25, title: 'The Tide Turns',
    text: 'Wisdom is not the absence of error — it is the grace to learn from flow.' },
  { id: 'lore-wisdom-2', stat: 'wisdom', threshold: 75, title: 'The Deep Current',
    text: 'When wisdom runs deep, even the void becomes navigable.' },
  { id: 'lore-integrity-1', stat: 'integrity', threshold: 25, title: 'The Forge Kindles',
    text: 'A single true act is worth a thousand hollow promises.' },
  { id: 'lore-integrity-2', stat: 'integrity', threshold: 75, title: 'The Forge Blazes',
    text: 'The board does not forget — every move of integrity is written in light.' },
  { id: 'lore-community-1', stat: 'community', threshold: 25, title: 'The Root Spreads',
    text: 'Community does not shout; it grows quietly until it cannot be uprooted.' },
  { id: 'lore-community-2', stat: 'community', threshold: 75, title: 'The Forest Rises',
    text: 'When all act as one, the lattice becomes unbreakable.' },
];

export function getFragmentById(id) {
  return LORE_FRAGMENTS.find(f => f.id === id) || null;
}

export function getFragmentsByElement(element) {
  return LORE_FRAGMENTS.filter(f => f.element === element);
}

export function getFragmentsByStat(stat) {
  return LORE_FRAGMENTS.filter(f => f.stat === stat);
}
