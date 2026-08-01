import test from "node:test";
import assert from "node:assert/strict";

async function loadMerge() {
  try {
    return (await import("../src/lib/activityFeed.ts")).mergeActivityEntries;
  } catch {
    return undefined;
  }
}

function entry(eventKey, blockNumber, logIndex, text = eventKey) {
  return { id: blockNumber * 10 + logIndex, eventKey, blockNumber, logIndex, time: "12:00:00", text };
}

test("collapses the same event received by both listener and poller", async () => {
  const mergeActivityEntries = await loadMerge();
  assert.equal(typeof mergeActivityEntries, "function");

  const listenerEntry = entry("0xabc:2", 100, 2, "Bounty #1 accepted");
  const polledEntry = { ...listenerEntry, id: 999, time: "12:00:05" };

  assert.deepEqual(mergeActivityEntries([listenerEntry], [polledEntry], 25), [listenerEntry]);
});

test("orders merged activity newest first by block and log index", async () => {
  const mergeActivityEntries = await loadMerge();
  assert.equal(typeof mergeActivityEntries, "function");

  const older = entry("0xaaa:0", 100, 0);
  const sameBlockLater = entry("0xbbb:3", 101, 3);
  const sameBlockEarlier = entry("0xbbb:1", 101, 1);

  assert.deepEqual(
    mergeActivityEntries([older], [sameBlockEarlier, sameBlockLater], 25),
    [sameBlockLater, sameBlockEarlier, older]
  );
});

test("caps the merged activity feed to the requested limit", async () => {
  const mergeActivityEntries = await loadMerge();
  assert.equal(typeof mergeActivityEntries, "function");

  const entries = [entry("0x1:0", 1, 0), entry("0x2:0", 2, 0), entry("0x3:0", 3, 0)];

  assert.deepEqual(mergeActivityEntries([], entries, 2), [entries[2], entries[1]]);
});
