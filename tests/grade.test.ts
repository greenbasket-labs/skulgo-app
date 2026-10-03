import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryCARepository } from "../packages/ca/src/in-memory-repository";
import { InMemoryExamRepository } from "../packages/exam/src/in-memory-repository";
import { ResultsService } from "../packages/results/src/service";
import { TotalsService } from "../packages/totals/src/service";
import { GradeService } from "../packages/grade/src/service";
const query={schoolId:"school-1",studentId:"student-1",classId:"class-1",subjectId:"subject-1",sessionId:"session-1",termId:"term-1"};
const scale={schoolId:"school-1",bands:[
 {gradeId:"a",schoolId:"school-1",label:"A",minimumTotal:80,maximumTotal:100},
 {gradeId:"b",schoolId:"school-1",label:"B",minimumTotal:70,maximumTotal:79},
 {gradeId:"c",schoolId:"school-1",label:"C",minimumTotal:60,maximumTotal:69},
 {gradeId:"d",schoolId:"school-1",label:"D",minimumTotal:50,maximumTotal:59},
 {gradeId:"e",schoolId:"school-1",label:"E",minimumTotal:40,maximumTotal:49},
 {gradeId:"f",schoolId:"school-1",label:"F",minimumTotal:0,maximumTotal:39},
]};
test("grade uses configured scale",async()=>{
 const ca=new InMemoryCARepository(),exam=new InMemoryExamRepository();
 await ca.saveRecord({caId:"ca",schoolId:"school-1",studentId:"student-1",classId:"class-1",subjectId:"subject-1",teacherId:"teacher-1",sessionId:"session-1",termId:"term-1",assessmentName:"CA 1",maximumScore:20,score:18,date:"2026-10-01",createdAt:"2026-10-01",updatedAt:"2026-10-01"});
 await exam.saveExam({examId:"exam",schoolId:"school-1",classId:"class-1",subjectId:"subject-1",teacherId:"teacher-1",sessionId:"session-1",termId:"term-1",name:"Exam",maximumScore:100,date:"2026-12-10",createdAt:"2026-10-01"});
 await exam.saveScore({examScoreId:"score",examId:"exam",schoolId:"school-1",studentId:"student-1",classId:"class-1",subjectId:"subject-1",teacherId:"teacher-1",sessionId:"session-1",termId:"term-1",score:72,date:"2026-12-10",createdAt:"2026-12-10",updatedAt:"2026-12-10"});
 const r=await new GradeService(new TotalsService(new ResultsService(ca,exam))).getGrade(query,scale,{canView:true});
 assert.equal(r.total,90);assert.equal(r.grade,"A");
});
test("grade stays empty without total",async()=>{
 const r=await new GradeService(new TotalsService(new ResultsService(new InMemoryCARepository(),new InMemoryExamRepository()))).getGrade(query,scale,{canView:true});
 assert.equal(r.total,undefined);assert.equal(r.grade,undefined);
});
test("grade rejects overlapping bands",async()=>{
 const overlap={schoolId:"school-1",bands:[{gradeId:"a",schoolId:"school-1",label:"A",minimumTotal:80,maximumTotal:100},{gradeId:"b",schoolId:"school-1",label:"B",minimumTotal:70,maximumTotal:85}]};
 const ca=new InMemoryCARepository();
 await ca.saveRecord({caId:"ca",schoolId:"school-1",studentId:"student-1",classId:"class-1",subjectId:"subject-1",teacherId:"teacher-1",sessionId:"session-1",termId:"term-1",assessmentName:"CA 1",maximumScore:100,score:90,date:"2026-10-01",createdAt:"2026-10-01",updatedAt:"2026-10-01"});
 await assert.rejects(()=>new GradeService(new TotalsService(new ResultsService(ca,new InMemoryExamRepository()))).getGrade(query,overlap,{canView:true}),/overlapping bands/);
});
