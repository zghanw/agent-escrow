export interface ActivityFeedEntry {
  id: number;
  eventKey: string;
  blockNumber: number;
  logIndex: number;
  time: string;
  text: string;
}

export function mergeActivityEntries(
  current: ActivityFeedEntry[],
  incoming: ActivityFeedEntry[],
  limit: number
) {
  const byEvent = new Map<string, ActivityFeedEntry>();
  for (const entry of [...current, ...incoming]) {
    if (!byEvent.has(entry.eventKey)) byEvent.set(entry.eventKey, entry);
  }

  return [...byEvent.values()]
    .sort((a, b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex)
    .slice(0, limit);
}
