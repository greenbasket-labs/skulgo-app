import type { Fee, PaymentRecord, StudentFee } from "./model";

export interface FeesRepository {
  saveFee(fee: Fee): Promise<void>;
  getFee(feeId: string): Promise<Fee | undefined>;
  listFees(schoolId: string): Promise<Fee[]>;
  saveStudentFee(studentFee: StudentFee): Promise<void>;
  listStudentFees(schoolId: string, studentId: string): Promise<StudentFee[]>;
  savePayment(payment: PaymentRecord): Promise<void>;
  listPayments(schoolId: string, studentId: string): Promise<PaymentRecord[]>;
}
