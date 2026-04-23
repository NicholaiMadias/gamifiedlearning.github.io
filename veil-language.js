const reassuranceWords = ['again', 'still', 'now', 'please', 'may', 'just'];

function veilSeen(playerOrFlag) {
  return typeof playerOrFlag === 'boolean'
    ? playerOrFlag
    : !!(playerOrFlag && playerOrFlag.hasSeenTheVeil);
}

export function renderAssumedLine(base, veilFragment, player) {
  const seen = veilSeen(player);
  if (seen && veilFragment) {
    return `${base} ${veilFragment}`.trim();
  }
  return base;
}

export function renderVeilVariant(lineSpec, player) {
  const seen = veilSeen(player);
  if (seen && lineSpec.veilVariant) {
    return lineSpec.veilVariant;
  }
  return renderAssumedLine(lineSpec.base, lineSpec.veilFragment, seen);
}

export function renderArchivistDiagnostic(base, veilFragment, player) {
  const seen = veilSeen(player);
  const clipped = seen ? firstSentence(base) : base;
  return renderAssumedLine(clipped, veilFragment, seen);
}

export function renderEnvironmentPrompt(base, player) {
  const seen = veilSeen(player);
  if (!seen) return base.trim();

  let streamlined = base.trim();
  reassuranceWords.forEach(word => {
    const pattern = new RegExp(`\\b${word}\\b`, 'gi');
    streamlined = streamlined.replace(pattern, '');
  });
  streamlined = streamlined.replace(/\bYou\s+/i, '');
  streamlined = streamlined.replace(/\s+/g, ' ').trim();

  if (!/[.!?]$/.test(streamlined) && streamlined.length) {
    streamlined += '.';
  }
  return capitalizeFirst(streamlined);
}

function firstSentence(text) {
  const match = text.match(/[^.!?]*[.!?]/);
  return match ? match[0].trim() : text.trim();
}

function capitalizeFirst(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
