# Lore Map

Visual guide to how lore entries unlock across the Nexus Arcade OS.

## Unlock Triggers

```
[Default / Always Visible]
  ├─ nexus-origin      "The Origin of Nexus"
  └─ seven-seals       "The Seven Seals"

[combo-tier4]
  └─ mystery-of-the-meter   "Mystery of the Meter"

[revelation-achieved]
  └─ revelation-prophecy    "The Revelation Prophecy"

[unlock:npc-village]
  └─ npc-origins            "The Village Inhabitants"
```

## Lore Entry Format (`config/lore.json`)

```json
{
  "id": "entry-id",
  "title": "Display Title",
  "body": "Full entry text.",
  "unlockTrigger": "event-name | default"
}
```

## Adding New Entries

1. Add an entry object to `config/lore.json`
2. Set `unlockTrigger` to the OS event name that should reveal it (or `"default"` for always visible)
3. In `modules/lore-codex.js`, emit `NexusOS.emit('lore-unlock', { id: 'entry-id' })` when the trigger fires

## Narrative Arc

```
Nexus Origin  →  Seven Stars  →  Revelation  →  Mystery Meter  →  NPC Village
   (intro)         (faith)        (power)         (growth)          (community)
```

The lore is designed to mirror the spiritual journey through the Seven Churches of Revelation, culminating in community and purpose in the NPC Village.
