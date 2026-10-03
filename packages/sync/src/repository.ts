import type { SyncChange, SyncChangeStatus } from "./model";

export interface SyncRepository {
  save(change: SyncChange): Promise<void>;
  get(changeId: string): Promise<SyncChange | undefined>;
  listPending(sourceNodeId: string): Promise<SyncChange[]>;
  listByStatus(status: SyncChangeStatus): Promise<SyncChange[]>;
}
