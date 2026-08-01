import assert from "node:assert/strict";
import test from "node:test";

async function loadHelper() {
  try {
    return (await import("../src/lib/bountyRead.ts")).readBountyWithNotFoundRetry;
  } catch {
    return undefined;
  }
}

test("returns an available bounty without waiting", async () => {
  const helper = await loadHelper();
  assert.equal(typeof helper, "function");
  let reads = 0;
  let waits = 0;

  const result = await helper(
    async () => {
      reads += 1;
      return { id: 1n };
    },
    async () => {
      waits += 1;
    },
  );

  assert.deepEqual(result, { id: 1n });
  assert.equal(reads, 1);
  assert.equal(waits, 0);
});

test("retries once when the first read returns no bounty", async () => {
  const helper = await loadHelper();
  assert.equal(typeof helper, "function");
  let reads = 0;
  let waits = 0;

  const result = await helper(
    async () => (++reads === 1 ? null : { id: 2n }),
    async () => {
      waits += 1;
    },
  );

  assert.deepEqual(result, { id: 2n });
  assert.equal(reads, 2);
  assert.equal(waits, 1);
});

test("retries once after a Bounty does not exist RPC revert", async () => {
  const helper = await loadHelper();
  assert.equal(typeof helper, "function");
  let reads = 0;

  const result = await helper(
    async () => {
      reads += 1;
      if (reads === 1) {
        throw { info: { error: { message: "execution reverted: Bounty does not exist" } } };
      }
      return { id: 3n };
    },
    async () => {},
  );

  assert.deepEqual(result, { id: 3n });
  assert.equal(reads, 2);
});

test("returns null after two not-found responses", async () => {
  const helper = await loadHelper();
  assert.equal(typeof helper, "function");
  let reads = 0;

  const result = await helper(
    async () => {
      reads += 1;
      throw new Error("execution reverted: Bounty does not exist");
    },
    async () => {},
  );

  assert.equal(result, null);
  assert.equal(reads, 2);
});

test("rethrows unrelated errors without retrying", async () => {
  const helper = await loadHelper();
  assert.equal(typeof helper, "function");
  const original = new Error("network unavailable");
  let reads = 0;
  let waits = 0;

  await assert.rejects(
    helper(
      async () => {
        reads += 1;
        throw original;
      },
      async () => {
        waits += 1;
      },
    ),
    (error) => error === original,
  );
  assert.equal(reads, 1);
  assert.equal(waits, 0);
});
