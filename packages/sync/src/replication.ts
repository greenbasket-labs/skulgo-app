import type { RecordChange } from "../../school-records/src/record";

export type SyncState =
  | "local_saved"
  | "queued"
  | "sending"
  | "received"
  | "acknowledged"
  | "conflict";

export interface OutboxItem<T = unknown> {
  change: RecordChange<T>;
  state: SyncState;
  acknowledgedAt?: string;
}

export interface SyncReceipt {
  changeId: string;
  receiverDeviceId: string;
  receivedAt: string;
  acknowledgedAt: string;
}

/**
 * In-memory reference implementation of the replication contract.
 * A real adapter will persist these operations in SQLite.
 */
export class ReplicationQueue<T = unknown> {
  private readonly outbox = new Map<string, OutboxItem<T>>();

  enqueue(change: RecordChange<T>): void {
    if (!this.outbox.has(change.changeId)) {
      this.outbox.set(change.changeId, {
        change,
        state: "queued",
      });
    }
  }

  pending(): OutboxItem<T>[] {
    return [...this.outbox.values()].filter(
      (item) =>
        item.state === "queued" ||
        item.state === "sending",
    );
  }

  markSending(changeId: string): void {
    const item = this.outbox.get(changeId);
    if (item) item.state = "sending";
  }

  acknowledge(receipt: SyncReceipt): void {
    const item = this.outbox.get(receipt.changeId);
    if (!item) return;

    item.state = "acknowledged";
    item.acknowledgedAt = receipt.acknowledgedAt;
  }

  get(changeId: string): OutboxItem<T> | undefined {
    return this.outbox.get(changeId);
  }
}
