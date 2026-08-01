const BOUNTY_NOT_FOUND_MESSAGE = "bounty does not exist";

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return "";

  const candidate = error as {
    message?: unknown;
    shortMessage?: unknown;
    reason?: unknown;
    error?: { message?: unknown };
    info?: { error?: { message?: unknown } };
  };

  return [
    candidate.message,
    candidate.shortMessage,
    candidate.reason,
    candidate.error?.message,
    candidate.info?.error?.message,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

export function isBountyNotFoundError(error: unknown): boolean {
  return getErrorMessage(error).toLowerCase().includes(BOUNTY_NOT_FOUND_MESSAGE);
}

export async function readBountyWithNotFoundRetry<T>(
  read: () => Promise<T | null>,
  wait: () => Promise<void>,
): Promise<T | null> {
  try {
    const result = await read();
    if (result !== null) return result;
  } catch (error) {
    if (!isBountyNotFoundError(error)) throw error;
  }

  await wait();

  try {
    return await read();
  } catch (error) {
    if (isBountyNotFoundError(error)) return null;
    throw error;
  }
}
