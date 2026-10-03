import type { RecordChange } from "../../school-records/src/record";

export type DeliveryState = "queued" | "sending" | "acknowledged" | "conflict";

export interface StoredChange<T = unknown> {
  change: RecordChange<T>;
  state: DeliveryState;
  acknowledgedAt?: string;
}

export interface ChangeStore<T = unknown> {
  save(change: RecordChange<T>): void;
  get(changeId: string): StoredChange<T> | undefined;
  pending(): StoredChange<T>[];
  acknowledge(changeId: string, acknowledgedAt: string): void;
}

export class MemoryChangeStore<T = unknown> implements ChangeStore<T> {
  private readonly changes = new Map<string, StoredChange<T>>();

  save(change: RecordChange<T>): void {
    if (!this.changes.has(change.changeId)) {
      this.changes.set(change.changeId, { change, state: "queued" });
    }
  }

  get(changeId: string): StoredChange<T> | undefined {
    return this.changes.get(changeId);
  }

  pending(): StoredChange<T>[] {
    return [...this.changes.values()].filter(
      (item) => item.state === "queued" || item.state === "sending",
    );
  }

  acknowledge(changeId: string, acknowledgedAt: string): void {
    const item = this.changes.get(changeId);
    if (!item) return;
    item.state = "acknowledged";
    item.acknowledgedAt = acknowledgedAt;
  }
}
