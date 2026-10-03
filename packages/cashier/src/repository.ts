import type { PaymentRecord } from "../../fees/src/model";

export interface CashierRepository {
  getPayment(paymentId: string): Promise<PaymentRecord | undefined>;
  savePayment(payment: PaymentRecord): Promise<void>;
  listStudentPayments(schoolId: string, studentId: string): Promise<PaymentRecord[]>;
}
