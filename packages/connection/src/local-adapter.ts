import type { RecordChange } from "../../school-records/src/record";
import type { TransportReceipt } from "../../sync/src/transport";

export interface LocalConnectionEndpoint<T = unknown> {
  deviceId: string;
  schoolId: string;
  approved: boolean;
  send(change: RecordChange<T>): Promise<TransportReceipt>;
}

export interface LocalConnection<T = unknown> {
  readonly sourceDeviceId: string;
  readonly targetDeviceId: string;
  readonly schoolId: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(change: RecordChange<T>): Promise<TransportReceipt>;
  isConnected(): boolean;
}

export class LocalNetworkConnection<T = unknown> implements LocalConnection<T> {
  private connected = false;
  readonly sourceDeviceId: string;
  readonly targetDeviceId: string;
  readonly schoolId: string;

  constructor(
    private readonly source: LocalConnectionEndpoint<T>,
    private readonly target: LocalConnectionEndpoint<T>,
  ) {
    this.sourceDeviceId = source.deviceId;
    this.targetDeviceId = target.deviceId;
    this.schoolId = source.schoolId;
  }

  async connect(): Promise<void> {
    if (this.source.schoolId !== this.target.schoolId) {
      throw new Error("Local connection cannot connect different schools");
    }
    if (!this.source.approved || !this.target.approved) {
      throw new Error("Local connection requires approved devices");
    }
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async send(change: RecordChange<T>): Promise<TransportReceipt> {
    if (!this.connected) throw new Error("Local connection is not connected");
    if (change.record.schoolId !== this.schoolId) {
      throw new Error("Record belongs to another school");
    }
    return this.target.send(change);
  }
}