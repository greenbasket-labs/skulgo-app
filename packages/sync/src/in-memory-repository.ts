import type { SyncChange, SyncChangeStatus } from "./model";
import type { SyncRepository } from "./repository";

export class SyncInMemoryRepository implements SyncRepository {
  private readonly changes = new Map<string, SyncChange>();

  constructor(initialChanges: SyncChange[] = []) {
    for (const change of initialChanges) this.changes.set(change.changeId, change);
  }

  async save(change: SyncChange): Promise<void> { this.changes.set(change.changeId, change); }
  async get(changeId: string): Promise<SyncChange | undefined> { return this.changes.get(changeId); }

  async listPending(sourceNodeId: string): Promise<SyncChange[]> {
    return [...this.changes.values()].filter((c) => c.sourceNodeId === sourceNodeId && c.status === "PENDING").sort((a,b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listByStatus(status: SyncChangeStatus): Promise<SyncChange[]> {
    return [...this.changes.values()].filter((c) => c.status === status);
  }
}
