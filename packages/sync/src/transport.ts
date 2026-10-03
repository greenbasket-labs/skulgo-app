import type { RecordChange } from "../../school-records/src/record";
import { isRecordVisibleToNode, type SyncNode, type SyncPermission } from "./model";
import type { NodeTransport, ReplicationNode } from "./node";

export interface TransportReceipt {
  receiverDeviceId: string;
  receivedAt: string;
  acknowledgedAt: string;
}

export interface LocalTransportEndpoint<T = unknown> {
  node: SyncNode;
  permission: SyncPermission;
  receiver: ReplicationNode<T>;
}

/**
 * Local transport boundary for nodes connected through the same trusted
 * local connection (for example school Wi-Fi or a phone hotspot).
 *
 * The reference adapter below keeps delivery in-process. A real network
 * adapter can implement NodeTransport without changing Sync or record logic.
 */
export class LocalTransport<T = unknown> implements NodeTransport<T> {
  constructor(
    private readonly sender: LocalTransportEndpoint<T>,
    private readonly receiver: LocalTransportEndpoint<T>,
  ) {}

  async send(change: RecordChange<T>): Promise<TransportReceipt> {
    if (!this.sender.permission.canSend) {
      throw new Error("Local sync sending not permitted");
    }
    if (!this.receiver.permission.canReceive) {
      throw new Error("Local sync receiving not permitted");
    }
    if (this.sender.node.schoolId !== this.receiver.node.schoolId) {
      throw new Error("Local transport cannot connect different schools");
    }
    if (change.record.schoolId !== this.sender.node.schoolId) {
      throw new Error("Record belongs to another school");
    }
    if (!isRecordVisibleToNode(change.record, this.receiver.node)) {
      throw new Error("Record is not visible to receiver node");
    }

    const receivedAt = new Date().toISOString();
    const result = this.receiver.receiver.receive(change);

    if (result.status === "conflict") {
      throw new Error(`Replication conflict for ${change.record.recordId}`);
    }

    return {
      receiverDeviceId: this.receiver.node.nodeId,
      receivedAt,
      acknowledgedAt: new Date().toISOString(),
    };
  }
}

export function connectLocalTransport<T>(
  sender: LocalTransportEndpoint<T>,
  receiver: LocalTransportEndpoint<T>,
): NodeTransport<T> {
  return new LocalTransport(sender, receiver);
}
