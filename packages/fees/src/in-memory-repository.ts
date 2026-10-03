import type { Fee, PaymentRecord, StudentFee } from "./model";
import type { FeesRepository } from "./repository";

export class FeesInMemoryRepository implements FeesRepository {
  private readonly fees = new Map<string, Fee>();
  private readonly studentFees = new Map<string, StudentFee>();
  private readonly payments = new Map<string, PaymentRecord>();

  async saveFee(fee: Fee): Promise<void> { this.fees.set(fee.feeId, fee); }
  async getFee(feeId: string): Promise<Fee | undefined> { return this.fees.get(feeId); }
  async listFees(schoolId: string): Promise<Fee[]> {
    return [...this.fees.values()].filter((fee) => fee.schoolId === schoolId);
  }

  async saveStudentFee(studentFee: StudentFee): Promise<void> {
    this.studentFees.set(studentFee.studentFeeId, studentFee);
  }
  async listStudentFees(schoolId: string, studentId: string): Promise<StudentFee[]> {
    return [...this.studentFees.values()].filter(
      (fee) => fee.schoolId === schoolId && fee.studentId === studentId,
    );
  }

  async savePayment(payment: PaymentRecord): Promise<void> {
    this.payments.set(payment.paymentId, payment);
  }
  async listPayments(schoolId: string, studentId: string): Promise<PaymentRecord[]> {
    return [...this.payments.values()].filter(
      (payment) => payment.schoolId === schoolId && payment.studentId === studentId,
    );
  }
}
