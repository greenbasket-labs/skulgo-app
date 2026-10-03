import type { FeesRepository } from "./repository";
import type { Fee, PaymentRecord, StudentBalance } from "./model";

export interface FeesPermission {
  canManage: boolean;
  canView: boolean;
  canRecordPayment: boolean;
}

export class FeesService {
  constructor(private readonly repository: FeesRepository) {}

  async createFee(fee: Fee, permission: FeesPermission): Promise<Fee> {
    if (!permission.canManage) throw new Error("Fee management not permitted");
    if (!fee.name.trim()) throw new Error("Fee name is required");
    if (fee.amount <= 0) throw new Error("Fee amount must be greater than zero");
    if (fee.scope === "CLASS" && !fee.classId) throw new Error("Class is required for class fee");

    const created = { ...fee, name: fee.name.trim() };
    await this.repository.saveFee(created);
    return created;
  }

  async assignFeeToStudent(
    feeId: string,
    studentId: string,
    schoolId: string,
    permission: FeesPermission,
    createdAt: string,
  ) {
    if (!permission.canManage) throw new Error("Fee management not permitted");
    const fee = await this.repository.getFee(feeId);
    if (!fee || fee.schoolId !== schoolId) throw new Error("Fee not found");

    const studentFee = {
      studentFeeId: [feeId, studentId].join(":"),
      feeId,
      schoolId,
      studentId,
      amount: fee.amount,
      createdAt,
    };
    await this.repository.saveStudentFee(studentFee);
    return studentFee;
  }

  async recordPayment(
    payment: PaymentRecord,
    permission: FeesPermission,
  ): Promise<PaymentRecord> {
    if (!permission.canRecordPayment) throw new Error("Payment recording not permitted");
    if (payment.amount <= 0) throw new Error("Payment amount must be greater than zero");

    const fee = await this.repository.getFee(payment.feeId);
    if (!fee || fee.schoolId !== payment.schoolId) throw new Error("Fee not found");

    const studentFees = await this.repository.listStudentFees(payment.schoolId, payment.studentId);
    if (!studentFees.some((item) => item.feeId === payment.feeId)) {
      throw new Error("Fee is not assigned to student");
    }

    const created = { ...payment, status: "RECORDED" as const };
    await this.repository.savePayment(created);
    return created;
  }

  async getStudentBalance(
    schoolId: string,
    studentId: string,
    feeId: string,
    permission: FeesPermission,
  ): Promise<StudentBalance> {
    if (!permission.canView) throw new Error("Fee viewing not permitted");

    const fee = await this.repository.getFee(feeId);
    if (!fee || fee.schoolId !== schoolId) throw new Error("Fee not found");

    const studentFees = await this.repository.listStudentFees(schoolId, studentId);
    const assigned = studentFees.find((item) => item.feeId === feeId);
    if (!assigned) throw new Error("Fee is not assigned to student");

    const payments = await this.repository.listPayments(schoolId, studentId);
    const paidAmount = payments
      .filter((payment) => payment.feeId === feeId && payment.status !== "REJECTED")
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      studentId,
      feeId,
      feeAmount: assigned.amount,
      paidAmount,
      balance: Math.max(assigned.amount - paidAmount, 0),
    };
  }

  async listFees(schoolId: string, permission: FeesPermission): Promise<Fee[]> {
    if (!permission.canView) throw new Error("Fee viewing not permitted");
    return this.repository.listFees(schoolId);
  }
}
