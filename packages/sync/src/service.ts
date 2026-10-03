import type { RecordChange, SchoolRecord } from "../../school-records/src/record";
import { isRecordVisibleToNode, type SyncChange, type SyncNode, type SyncPermission, type SyncEnvelope } from "./model";
import type { SyncRepository } from "./repository";

export class SyncService {
  constructor(private readonly repository: SyncRepository) {}

  async queueChange<TPayload>(change: RecordChange<TPayload>, sourceNode: SyncNode, permission: SyncPermission): Promise<SyncChange<TPayload>> {
    if (!permission.canSend) throw new Error("Sync sending not permitted");
    if (change.record.schoolId !== sourceNode.schoolId) throw new Error("Record belongs to another school");
    const existing = await this.repository.get(change.changeId);
    if (existing) return existing as SyncChange<TPayload>;
    const queued: SyncChange<TPayload> = {
      changeId: change.changeId, schoolId: change.record.schoolId, sourceNodeId: sourceNode.nodeId,
      record: change.record, actorUserId: change.actorUserId, createdAt: change.createdAt, status: "PENDING",
    };
    await this.repository.save(queued);
    return queued;
  }

  async prepareForNode<TPayload>(change: SyncChange<TPayload>, targetNode: SyncNode, permission: SyncPermission): Promise<SyncEnvelope<TPayload> | undefined> {
    if (!permission.canSend) throw new Error("Sync sending not permitted");
    if (change.schoolId !== targetNode.schoolId || !isRecordVisibleToNode(change.record, targetNode)) return undefined;
    return {
      changeId: change.changeId, schoolId: change.schoolId, sourceNodeId: change.sourceNodeId,
      targetNodeId: targetNode.nodeId, record: change.record, actorUserId: change.actorUserId, createdAt: change.createdAt,
    };
  }

  async applyEnvelope(envelope: SyncEnvelope, targetNode: SyncNode, permission: SyncPermission, existingRecord?: SchoolRecord): Promise<"APPLIED" | "DUPLICATE"> {
    if (!permission.canReceive) throw new Error("Sync receiving not permitted");
    if (envelope.schoolId !== targetNode.schoolId) throw new Error("Sync envelope belongs to another school");
    if (envelope.targetNodeId && envelope.targetNodeId !== targetNode.nodeId) throw new Error("Sync envelope targets another node");
    if (!isRecordVisibleToNode(envelope.record, targetNode)) throw new Error("Record is not visible to this node");
    if (existingRecord && existingRecord.recordId === envelope.record.recordId && existingRecord.entityVersion >= envelope.record.entityVersion) return "DUPLICATE";
    const existingChange = await this.repository.get(envelope.changeId);
    if (existingChange?.status === "APPLIED") return "DUPLICATE";
    await this.repository.save({ ...envelope, status: "APPLIED" });
    return "APPLIED";
  }

  async acknowledge(changeId: string): Promise<SyncChange> {
    const change = await this.repository.get(changeId);
    if (!change) throw new Error("Sync change not found");
    if (change.status === "REJECTED") throw new Error("Rejected sync change cannot be acknowledged");
    const acknowledged = { ...change, status: "ACKNOWLEDGED" as const };
    await this.repository.save(acknowledged);
    return acknowledged;
  }

  async listPending(sourceNodeId: string): Promise<SyncChange[]> {
    return this.repository.listPending(sourceNodeId);
  }
}
