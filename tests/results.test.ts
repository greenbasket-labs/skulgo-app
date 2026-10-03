import assert from "node:assert/strict";
import test from "node:test";
import { ResultsService } from "../packages/results/src/service";
import { InMemoryCARepository } from "../packages/ca/src/in-memory-repository";
import { InMemoryExamRepository } from "../packages/exam/src/in-memory-repository";

test("results brings CA and exam records together without calculating them", async () => {
  const ca = new InMemoryCARepository(), exam = new InMemoryExamRepository();
  await ca.saveRecord({ caId:"ca-1", schoolId:"school-1", studentId:"student-1", classId:"class-1", subjectId:"subject-1", teacherId:"teacher-1", sessionId:"session-1", termId:"term-1", assessmentName:"CA 1", maximumScore:20, score:15, date:"2026-10-01", createdAt:"2026-10-01T00:00:00.000Z", updatedAt:"2026-10-01T00:00:00.000Z" });
  await exam.saveExam({ examId:"exam-1", schoolId:"school-1", classId:"class-1", subjectId:"subject-1", teacherId:"teacher-1", sessionId:"session-1", termId:"term-1", name:"First Term Examination", maximumScore:100, date:"2026-12-10", createdAt:"2026-10-01T00:00:00.000Z" });
  await exam.saveScore({ examScoreId:"score-1", examId:"exam-1", schoolId:"school-1", studentId:"student-1", classId:"class-1", subjectId:"subject-1", teacherId:"teacher-1", sessionId:"session-1", termId:"term-1", score:72, date:"2026-12-10", createdAt:"2026-12-10T00:00:00.000Z", updatedAt:"2026-12-10T00:00:00.000Z" });
  const r=await new ResultsService(ca,exam).getResult({schoolId:"school-1",studentId:"student-1",classId:"class-1",subjectId:"subject-1",sessionId:"session-1",termId:"term-1"},{canView:true});
  assert.equal(r.caRecords[0].score,15); assert.equal(r.examRecords[0].score,72); assert.equal("totalScore" in r,false);
});
test("results requires view permission", async () => {
  const s=new ResultsService(new InMemoryCARepository(),new InMemoryExamRepository());
  await assert.rejects(()=>s.getResult({schoolId:"school-1",studentId:"student-1",classId:"class-1",subjectId:"subject-1",sessionId:"session-1",termId:"term-1"},{canView:false}),/Results viewing not permitted/);
});
