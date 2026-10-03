import type { RecordChange, SchoolRecord } from "../../school-records/src/record";
import type { ChangeStore } from "./store";

export interface ApplyResult {
  status: "applied" | "duplicate" | "conflict";
  changeId: string;
  recordVersion?: number;
}

export interface NodeTransport<T = unknown> {
  send(change: RecordChange<T>): Promise<{
    receiverDeviceId: string;
    receivedAt: string;
    acknowledgedAt: string;
  }>;
}

export class ReplicationNode<T = unknown> {
  private readonly records = new Map<string, SchoolRecord<T>>();
  private readonly receivedChanges = new Set<string>();

  constructor(
    readonly deviceId: string,
    private readonly outbox: ChangeStore<T>,
  ) {}

  saveLocal(record: SchoolRecord<T>): RecordChange<T> {
    const change: RecordChange<T> = {
      changeId: crypto.randomUUID(),
      record,
      actorUserId: record.userId,
      actorDeviceId: this.deviceId,
      createdAt: record.updatedAt,
    };

    this.records.set(record.recordId, record);
    this.outbox.save(change);
    return change;
  }

  receive(change: RecordChange<T>): ApplyResult {
    if (this.receivedChanges.has(change.changeId)) {
      return { status: "duplicate", changeId: change.changeId };
    }

    const existing = this.records.get(change.record.recordId);
    if (
      existing &&
      change.record.entityVersion <= existing.entityVersion
    ) {
      return {
        status: "conflict",
        changeId: change.changeId,
        recordVersion: existing.entityVersion,
      };
    }

    this.records.set(change.record.recordId, change.record);
    this.receivedChanges.add(change.changeId);

    return {
      status: "applied",
      changeId: change.changeId,
      recordVersion: change.record.entityVersion,
    };
  }

  getRecord(recordId: string): SchoolRecord<T> | undefined {
    return this.records.get(recordId);
  }

  async flush(transport: NodeTransport<T>): Promise<void> {
    for (const item of this.outbox.pending()) {
      const receipt = await transport.send(item.change);
      this.outbox.acknowledge(item.change.changeId, receipt.acknowledgedAt);
    }
  }
}

export function connectNodes<T>(
  sender: ReplicationNode<T>,
  receiver: ReplicationNode<T>,
): NodeTransport<T> {
  return {
    async send(change) {
      const receivedAt = new Date().toISOString();
      const result = receiver.receive(change);

      if (result.status === "conflict") {
        throw new Error(
          `Replication conflict for ${change.record.recordId}`,
        );
      }

      return {
        receiverDeviceId: receiver.deviceId,
        receivedAt,
        acknowledgedAt: new Date().toISOString(),
      };
    },
  };
}
