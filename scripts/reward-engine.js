// reward-engine.js — Cross-domain reward logic

const rewards = {
  'star-collected:Ephesus':    { item: 'ministry_scroll' },
  'star-collected:Smyrna':     { item: 'crown_of_life' },
  'star-collected:Pergamum':   { item: 'hidden_manna' },
  'star-collected:Thyatira':   { item: 'morning_star' },
  'star-collected:Sardis':     { item: 'white_garment' },
  'star-collected:Philadelphia': { item: 'open_door' },
  'star-collected:Laodicea':   { item: 'throne_seat' },
  'combo-tier4':               { badge: 'revelation_bearer' },
  'revelation-achieved':       { badge: 'revelation_bearer' },
  'listing-viewed:tampa':      { item: 'housing_key_tampa' },
};

function grantReward(key) {
  const reward = rewards[key];
  if (!reward) return;
  NexusOS.emit('reward-granted', reward);

  if (reward.badge) {
    NexusOS.emit('badge-earned', { badgeId: reward.badge });
  }
}

// Wire up all reward triggers
Object.keys(rewards).forEach(key => {
  NexusOS.on(key, () => grantReward(key));
});

// Also listen for generic star-collected events with star name
NexusOS.on('star-collected', ({ star }) => {
  grantReward(`star-collected:${star}`);
});
