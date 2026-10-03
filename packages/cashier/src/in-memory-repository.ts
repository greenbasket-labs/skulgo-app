import type { PaymentRecord } from "../../fees/src/model";
import type { CashierRepository } from "./repository";

export class CashierInMemoryRepository implements CashierRepository {
  private readonly payments = new Map<string, PaymentRecord>();

  constructor(payments: PaymentRecord[] = []) {
    for (const payment of payments) this.payments.set(payment.paymentId, payment);
  }

  async getPayment(paymentId: string): Promise<PaymentRecord | undefined> {
    return this.payments.get(paymentId);
  }

  async savePayment(payment: PaymentRecord): Promise<void> {
    this.payments.set(payment.paymentId, payment);
  }

  async listStudentPayments(schoolId: string, studentId: string): Promise<PaymentRecord[]> {
    return [...this.payments.values()].filter(
      (payment) => payment.schoolId === schoolId && payment.studentId === studentId,
    );
  }
}
