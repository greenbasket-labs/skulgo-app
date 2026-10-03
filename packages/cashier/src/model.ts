import type { PaymentRecord } from "../../fees/src/model";

export type CashierPaymentStatus = "RECORDED" | "VERIFIED" | "REJECTED";

export interface CashierPayment {
  payment: PaymentRecord;
  status: CashierPaymentStatus;
}

export interface CashierStudentPaymentView {
  studentId: string;
  payments: CashierPayment[];
}
