import type { FeesRepository } from "../../fees/src/repository";
import type { PaymentRecord } from "../../fees/src/model";
import type { CashierRepository } from "./repository";
import type { CashierStudentPaymentView } from "./model";

export interface CashierPermission {
  canView: boolean;
  canVerify: boolean;
}

export class CashierService {
  constructor(
    private readonly cashierRepository: CashierRepository,
    private readonly feesRepository: FeesRepository,
  ) {}

  async findStudentPayments(
    schoolId: string,
    studentId: string,
    permission: CashierPermission,
  ): Promise<CashierStudentPaymentView> {
    if (!permission.canView) throw new Error("Cashier viewing not permitted");

    const payments = await this.cashierRepository.listStudentPayments(schoolId, studentId);
    return { studentId, payments: payments.map((payment) => ({ payment, status: payment.status })) };
  }

  async verifyPayment(
    paymentId: string,
    schoolId: string,
    permission: CashierPermission,
  ): Promise<PaymentRecord> {
    if (!permission.canVerify) throw new Error("Payment verification not permitted");

    const payment = await this.cashierRepository.getPayment(paymentId);
    if (!payment || payment.schoolId !== schoolId) throw new Error("Payment not found");
    if (payment.status === "REJECTED") throw new Error("Rejected payment cannot be verified");

    const updated = { ...payment, status: "VERIFIED" as const };
    await this.cashierRepository.savePayment(updated);
    await this.feesRepository.savePayment(updated);
    return updated;
  }

  async rejectPayment(
    paymentId: string,
    schoolId: string,
    permission: CashierPermission,
  ): Promise<PaymentRecord> {
    if (!permission.canVerify) throw new Error("Payment verification not permitted");

    const payment = await this.cashierRepository.getPayment(paymentId);
    if (!payment || payment.schoolId !== schoolId) throw new Error("Payment not found");
    if (payment.status === "VERIFIED") throw new Error("Verified payment cannot be rejected");

    const updated = { ...payment, status: "REJECTED" as const };
    await this.cashierRepository.savePayment(updated);
    await this.feesRepository.savePayment(updated);
    return updated;
  }
}
