import type { NodeType, RecordChange, SchoolRecord } from "../../school-records/src/record";

export type SyncChangeStatus = "PENDING" | "ACKNOWLEDGED" | "APPLIED" | "REJECTED";

export interface SyncEnvelope<TPayload = unknown> {
  changeId: string;
  schoolId: string;
  sourceNodeId: string;
  targetNodeId?: string;
  record: SchoolRecord<TPayload>;
  actorUserId: string;
  createdAt: string;
}

export interface SyncChange<TPayload = unknown> extends SyncEnvelope<TPayload> {
  status: SyncChangeStatus;
}

export interface SyncNode {
  nodeId: string;
  schoolId: string;
  nodeType: NodeType;
  userId: string;
}

export interface SyncPermission {
  canReceive: boolean;
  canSend: boolean;
}

export function isRecordVisibleToNode(record: SchoolRecord, node: SyncNode): boolean {
  if (record.schoolId !== node.schoolId) return false;
  switch (record.visibility) {
    case "admin_private": return node.nodeType === "primary_admin" || node.nodeType === "trusted_admin";
    case "school_official": return node.nodeType !== "parent" && node.nodeType !== "student";
    case "teacher_assignment": return node.nodeType === "primary_admin" || node.nodeType === "trusted_admin" || node.userId === record.userId;
    case "cashier_assignment": return node.nodeType === "primary_admin" || node.nodeType === "trusted_admin" || node.userId === record.userId;
    case "parent_visible": return true;
    case "student_visible": return true;
    default: return false;
  }
}

export function toSyncEnvelope<TPayload>(change: RecordChange<TPayload>, sourceNodeId: string, targetNodeId?: string): SyncEnvelope<TPayload> {
  return {
    changeId: change.changeId,
    schoolId: change.record.schoolId,
    sourceNodeId,
    targetNodeId,
    record: change.record,
    actorUserId: change.actorUserId,
    createdAt: change.createdAt,
  };
}
