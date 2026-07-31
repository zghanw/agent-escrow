import { Panel } from "./Panel";
import type { FeedEntry } from "@/hooks/useEscrow";

export function EventFeedPanel({ feed }: { feed: FeedEntry[] }) {
  return (
    <Panel heading="Live activity">
      {feed.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--panel-muted)" }}>
          Watching the contract for new activity - actions you or anyone else takes will appear here in real time.
        </p>
      ) : (
        <div className="max-h-[220px] overflow-y-auto">
          {feed.map((entry) => (
            <div className="feed-item" key={entry.id}>
              <span className="feed-time">{entry.time}</span>
              <span>{entry.text}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
