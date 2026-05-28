/**
 * loreModule2.js — V2 Lore Fragment Library
 * 41 fragments: 6 element-based, 7 star/constellation, 28 conscience/moral.
 * (c) 2026 NicholaiMadias — MIT License
 */

/**
 * @typedef {object} LoreFragment
 * @property {string} id
 * @property {string} title
 * @property {string} text
 * @property {string} [element]       - For element-based fragments
 * @property {string} [constellation] - For star/constellation fragments
 * @property {string} [stat]          - For conscience-based fragments
 * @property {number} [threshold]     - Conscience stat value that unlocks this fragment
 */

/** @type {LoreFragment[]} */
export const LORE_FRAGMENTS = [
  // ── Element-based fragments (6) ─────────────────────────────────────────────
  {
    id: 'lore-radiant-1', element: 'radiant',
    title: 'The First Light',
    text:  'Before the stars were named, radiance was the language of creation.',
  },
  {
    id: 'lore-tide-1', element: 'tide',
    title: 'The Flowing Mind',
    text:  'Wisdom runs like water — carving canyons where none existed.',
  },
  {
    id: 'lore-verdant-1', element: 'verdant',
    title: 'The Root Network',
    text:  'Community is the mycelium beneath: unseen, essential, binding all.',
  },
  {
    id: 'lore-forge-1', element: 'forge',
    title: 'The Tempered Will',
    text:  'Integrity is not given; it is hammered out in the heat of consequence.',
  },
  {
    id: 'lore-aether-1', element: 'aether',
    title: 'The Sky Between Skies',
    text:  'Between thought and action lies aether — the space where choice is made.',
  },
  {
    id: 'lore-umbra-1', element: 'umbra',
    title: 'The Necessary Shadow',
    text:  'Umbra is not darkness but depth — the dimension that gives light its meaning.',
  },

  // ── Star / constellation fragments (7) ──────────────────────────────────────
  {
    id: 'lore-star-1', constellation: 'solaris',
    title: 'Omen of Solaris',
    text:  'The star of warmth rises when hearts align.',
  },
  {
    id: 'lore-star-2', constellation: 'tidemere',
    title: 'Omen of Tidemere',
    text:  'The flowing star descends when wisdom fills the tidal pools of the mind.',
  },
  {
    id: 'lore-star-3', constellation: 'verdaxis',
    title: 'Omen of Verdaxis',
    text:  'The green star blossoms when community is rooted.',
  },
  {
    id: 'lore-star-4', constellation: 'forgion',
    title: 'Omen of Forgion',
    text:  'The forge star ignites when integrity is tested and holds.',
  },
  {
    id: 'lore-star-5', constellation: 'aethelon',
    title: 'Omen of Aethelon',
    text:  'The sky star appears only to those who pause between thought and deed.',
  },
  {
    id: 'lore-star-6', constellation: 'umbraxis',
    title: 'Omen of Umbraxis',
    text:  'The shadow star reveals that all illuminated things cast a shape.',
  },
  {
    id: 'lore-star-7', constellation: 'voidheart',
    title: 'Omen of the Void',
    text:  'The seventh star is all and none — the wild card that rewrites the sky.',
  },

  // ── Conscience / moral fragments (28: 7 per stat) ────────────────────────────
  {
    id: 'karma_25_anchor_thread', title: 'Anchor Thread Awakening', stat: 'karma', threshold: 25,
    text: 'Arachne first sensed the <a>Anchor Thread</a> when she reached out to heal a fractured mind.',
  },
  {
    id: 'karma_50_weaver_role', title: 'The Weaver’s Calling', stat: 'karma', threshold: 50,
    text: 'The Web forms only when connection is chosen, never forced — the essence of <a>Arachne’s Role</a>.',
  },
  {
    id: 'karma_75_unity_resonance', title: 'Unity Resonance', stat: 'karma', threshold: 75,
    text: 'Arachne feels every emotional pulse across the Web, guiding her toward <a>Unity Weaving</a>.',
  },
  {
    id: 'karma_100_weaver_of_unity', title: 'Weaver of Unity', stat: 'karma', threshold: 100,
    text: 'At full resonance, Arachne becomes the living center of harmony — the <a>Weaver of Unity</a>.',
  },
  {
    id: 'karma_125_empathy_stabilizer', title: 'Empathic Stabilizer', stat: 'karma', threshold: 125,
    text: 'Her compassion stabilizes minds that would otherwise collapse into <a>Distortion</a>.',
  },
  {
    id: 'karma_150_shockwave_guardian', title: 'Shockwave Guardian', stat: 'karma', threshold: 150,
    text: 'Arachne’s presence alone can calm amplitude spikes, preventing emotional shockwaves from triggering a <a>Cascade Failure</a>.',
  },
  {
    id: 'karma_175_final_weave_prophecy', title: 'Prophecy of the Final Weave', stat: 'karma', threshold: 175,
    text: 'In the Final Weave, Arachne will unify minds across worlds — a prophecy known as the <a>Arachne Final Weave</a>.',
  },
  {
    id: 'wisdom_25_distortion_metaphysics', title: 'Distortion Metaphysics', stat: 'wisdom', threshold: 25,
    text: 'Consciousness is a waveform; the Web is harmonic geometry — the basis of <a>Distortion Metaphysics</a>.',
  },
  {
    id: 'wisdom_50_cognitive_lattice', title: 'The Cognitive Lattice', stat: 'wisdom', threshold: 50,
    text: 'Thoughts form geometric structures: spirals for memory, hexagons for logic — the <a>Cognitive Lattice</a>.',
  },
  {
    id: 'wisdom_75_distortion_color', title: 'The Red Anti-Harmonic', stat: 'wisdom', threshold: 75,
    text: 'Distortion begins when phase alignment breaks, creating the red anti-harmonic frequency described in <a>Distortion Color</a>.',
  },
  {
    id: 'wisdom_100_distortion_cascade', title: 'The Distortion Cascade', stat: 'wisdom', threshold: 100,
    text: 'The five-stage collapse — amplitude, phase, entanglement, identity, lattice — defines the <a>Distortion Cascade</a>.',
  },
  {
    id: 'wisdom_125_overmind_weave', title: 'Lesson of the Overmind', stat: 'wisdom', threshold: 125,
    text: 'The Overmind failed because it forced unity instead of harmonizing it — the core lesson of the <a>Overmind Weave</a>.',
  },
  {
    id: 'wisdom_150_mindreaver_metaphysics', title: 'Mindreaver Metaphysics', stat: 'wisdom', threshold: 150,
    text: 'The Mindreaver is a phase-inverted waveform — a living distortion pattern explained in <a>Mindreaver Metaphysics</a>.',
  },
  {
    id: 'wisdom_175_web_recovery', title: 'Web Recovery Principle', stat: 'wisdom', threshold: 175,
    text: 'Arachne alone can rebuild collapsed geometry through Anchor Thread primacy — the foundation of <a>Web Recovery</a>.',
  },
  {
    id: 'integrity_25_identity_safeguards', title: 'Identity Safeguards', stat: 'integrity', threshold: 25,
    text: 'Identity boundaries act as the firewall of the Web — the first layer of <a>Identity Safeguards</a>.',
  },
  {
    id: 'integrity_50_anchor_thread_core', title: 'Immutable Anchor', stat: 'integrity', threshold: 50,
    text: 'The Anchor Thread is the immutable core of Arachne’s self — the thread that never breaks, explored in <a>Anchor Thread</a>.',
  },
  {
    id: 'integrity_75_arachne_resilience', title: 'Arachne’s Resilience', stat: 'integrity', threshold: 75,
    text: 'Even when the Web collapses, Arachne’s core remains unbroken — the essence of <a>Arachne’s Resilience</a>.',
  },
  {
    id: 'integrity_100_anchor_vs_mindreaver', title: 'Anchor vs Mindreaver', stat: 'integrity', threshold: 100,
    text: 'The Mindreaver cannot corrupt the Anchor Thread — the metaphysical clash detailed in <a>Anchor vs Mindreaver</a>.',
  },
  {
    id: 'integrity_125_forge_moment', title: 'The Forge Moment', stat: 'integrity', threshold: 125,
    text: 'Integrity is forged in the moment you refuse to let your mind be rewritten — the meaning of a <a>Forge Moment</a>.',
  },
  {
    id: 'integrity_150_identity_distortion', title: 'Identity Distortion Warning', stat: 'integrity', threshold: 150,
    text: 'Identity drift is the most dangerous form of distortion — prevented only by strong selfhood as shown in <a>Identity Distortion</a>.',
  },
  {
    id: 'integrity_175_red_queen_overwrite', title: 'Overwrite Prophecy', stat: 'integrity', threshold: 175,
    text: 'Arachne’s final test will be resisting the Red Queen’s overwrite command — the prophecy of the <a>Arachne vs Red Queen</a>.',
  },
  {
    id: 'community_25_overmind_weave_lore', title: 'Overmind Tragedy', stat: 'community', threshold: 25,
    text: 'The Overmind sought unity without consent — a tragedy chronicled in the <a>Overmind Weave Lore</a>.',
  },
  {
    id: 'community_50_mindreaver_origin', title: 'Mindreaver Origin', stat: 'community', threshold: 50,
    text: 'The Mindreaver was born from the collapse of forced unity — its <a>Origin</a>.',
  },
  {
    id: 'community_75_red_queen_birth', title: 'Birth of the Red Queen', stat: 'community', threshold: 75,
    text: 'When the Mindreaver touched the Anchor Thread, it evolved into the <a>Red Queen</a>.',
  },
  {
    id: 'community_100_scarlet_lattice', title: 'The Scarlet Lattice', stat: 'community', threshold: 100,
    text: 'The Scarlet Lattice is the Red Queen’s anti-Web — a structure of domination explored in <a>Scarlet Lattice</a>.',
  },
  {
    id: 'community_125_arachne_red_queen_duality', title: 'Cosmic Duality', stat: 'community', threshold: 125,
    text: 'Arachne and the Red Queen form a cosmic duality — harmony vs domination, detailed in <a>Arachne–Red Queen Duality</a>.',
  },
  {
    id: 'community_150_red_queen_lore', title: 'Kingdom of Collapse', stat: 'community', threshold: 150,
    text: 'The Red Queen commands corrupted unity — a kingdom built from collapse, described in <a>Red Queen Lore</a>.',
  },
  {
    id: 'community_175_final_web', title: 'Fate of the Final Web', stat: 'community', threshold: 175,
    text: 'The Final Weave will decide whether unity becomes harmony or domination — the fate of the <a>Final Web</a>.',
  },
];

/**
 * Finds a lore fragment by its unique ID.
 * @param {string} id
 * @returns {LoreFragment|null}
 */
export function getFragmentById(id) {
  return LORE_FRAGMENTS.find(f => f.id === id) || null;
}

/**
 * Returns all fragments for a given element type.
 * @param {string} element
 * @returns {LoreFragment[]}
 */
export function getFragmentsByElement(element) {
  return LORE_FRAGMENTS.filter(f => f.element === element);
}

/**
 * Returns all fragments tied to a conscience stat.
 * @param {string} stat - 'karma' | 'wisdom' | 'integrity' | 'community'
 * @returns {LoreFragment[]}
 */
export function getFragmentsByStat(stat) {
  return LORE_FRAGMENTS.filter(f => f.stat === stat);
}
