const labels={home:"Home",classes:"My Classes",subjects:"Subjects",received:"Received",connect:"Connect","grade-band":"Grade Band",settings:"Settings"};
const DEFAULT_GRADE_BANDS=[{grade:"A",min:70,max:100},{grade:"B",min:60,max:69.99},{grade:"C",min:50,max:59.99},{grade:"D",min:45,max:49.99},{grade:"E",min:40,max:44.99},{grade:"F",min:0,max:39.99}];
const STORAGE="skulgo.teacher.workspace.v1";
const nav=document.querySelectorAll(".nav-item"), page=document.querySelector("#page"), title=document.querySelector("#page-title");
const menu=document.querySelector("#menu-button"), sidebar=document.querySelector("#sidebar");

function read(){try{return JSON.parse(localStorage.getItem(STORAGE)||"null")}catch{return null}}
function write(data){localStorage.setItem(STORAGE,JSON.stringify(data))}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function state(){const s=read()||{teacher:null,classes:[],subjects:[]};if(!Array.isArray(s.gradeBands)||!s.gradeBands.length)s.gradeBands=DEFAULT_GRADE_BANDS.map(x=>({...x}));return s}
function id(p){return p+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7)}

function gradeFromPercentage(percent){
 const s=state(),bands=Array.isArray(s.gradeBands)?s.gradeBands:DEFAULT_GRADE_BANDS;
 const match=bands.find(b=>percent>=Number(b.min)&&percent<=Number(b.max));
 return match?.grade||"—";
}
function hasExamEntry(subjectId,studentId){
 const s=state();
 return (Array.isArray(s.exams)?s.exams:[]).filter(a=>a.subjectId===subjectId).some(a=>(a.scores||[]).some(v=>v.studentId===studentId&&v.score!==undefined&&v.score!==null&&String(v.score).trim()!==""));
}
function renderGradeBand(){
 const s=state();
 page.innerHTML='<div class="section-heading"><div><h2>Grade Band</h2><p class="muted">Default grading bands for this Teacher workspace. Change the minimum and maximum percentage as needed.</p></div></div><form class="form-card" id="grade-band-form"><div class="grade-band-grid">'+s.gradeBands.map((b,i)=>'<div class="grade-band-row"><strong>'+esc(b.grade)+'</strong><input name="min-'+i+'" type="number" min="0" max="100" step="0.01" value="'+esc(b.min)+'" aria-label="Minimum percentage for '+esc(b.grade)+'"><span>to</span><input name="max-'+i+'" type="number" min="0" max="100" step="0.01" value="'+esc(b.max)+'" aria-label="Maximum percentage for '+esc(b.grade)+'"></div>').join("")+'</div><div class="form-actions"><button class="primary-button">Save Grade Band</button><button type="button" class="small-button" id="reset-grade-band">Reset Default</button></div><p class="form-message" id="grade-band-message"></p></form><div class="card"><h3>Special exam rule</h3><p>Before an exam is entered, the student has no grade. If an exam record is explicitly entered as <strong>0</strong>, the exam exists and grading is allowed. When an exam has maximum 0 and score 0, the displayed grade is <strong>S</strong>.</p></div>';
 document.querySelector("#grade-band-form").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),bands=s.gradeBands.map((b,i)=>({...b,min:Number(d.get("min-"+i)),max:Number(d.get("max-"+i))}));if(bands.some(b=>!Number.isFinite(b.min)||!Number.isFinite(b.max)||b.min<0||b.max>100||b.min>b.max)){document.querySelector("#grade-band-message").textContent="Each band must be between 0 and 100, with minimum not above maximum.";return}const st=state();st.gradeBands=bands;write(st);document.querySelector("#grade-band-message").textContent="Grade band saved.";};
 document.querySelector("#reset-grade-band").onclick=()=>{const st=state();st.gradeBands=DEFAULT_GRADE_BANDS.map(x=>({...x}));write(st);renderGradeBand()};
}
function renderHome(){
 const s=state();
 if(!s.teacher){page.innerHTML='<div class="section-heading"><div><h2>Welcome</h2><p class="muted">Create a local Teacher workspace. Normal school work stays offline.</p></div></div><div class="cards"><div class="card"><h3>Use as Teacher</h3><p>Name + 4-digit PIN. No internet required.</p><div class="card-action"><button class="primary-button" id="start-teacher">Create workspace</button></div></div><div class="card"><h3>Connect to School</h3><p>Pair with a school Admin workspace when connection is available.</p><div class="card-action"><button class="small-button" id="start-connect">Connect</button></div></div></div>';document.querySelector("#start-teacher").onclick=renderCreate;document.querySelector("#start-connect").onclick=()=>render("connect");return}
page.innerHTML='<div class="section-heading"><div><h2>Good day, '+esc(s.teacher.name)+'</h2><p class="muted">Your local Teacher workspace.</p></div><span class="chip">Offline ready</span></div><div class="cards">'+(s.classes.length?s.classes.map(c=>'<div class="card"><h3>'+esc(c.name)+'</h3><p>'+c.students.length+' active students</p><div class="card-action"><button class="small-button" data-open-class="'+c.id+'">Open class</button></div></div>').join(""):'<div class="card"><h3>No classes yet</h3><p>Start by creating your first class.</p><div class="card-action"><button class="primary-button" id="home-add-class">+ Add Class</button></div></div>')+'</div>';
 document.querySelectorAll("[data-open-class]").forEach(b=>b.onclick=()=>renderClass(b.dataset.openClass));document.querySelector("#home-add-class")?.addEventListener("click",renderClasses);
}
function renderCreate(){
 page.innerHTML='<div class="section-heading"><div><h2>Create Teacher Workspace</h2><p class="muted">This identity is stored on this device.</p></div></div><form class="form-card" id="create-form"><div class="form-grid"><label>Your name<input name="name" required></label><label>Create 4-digit PIN<input name="pin" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" required></label><label>Confirm PIN<input name="confirm" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" required></label></div><div class="form-actions"><button class="primary-button">Create workspace</button></div><p class="form-message" id="create-message"></p></form>';
 document.querySelector("#create-form").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget);const pin=String(d.get("pin"));if(pin!==d.get("confirm")){document.querySelector("#create-message").textContent="PINs do not match.";return}const s=state();s.teacher={name:String(d.get("name")).trim(),pin};write(s);render("home")};
}
function renderClasses(){
 const s=state();
 if(!s.teacher){return renderHome()}
 page.innerHTML='<div class="section-heading"><div><h2>My Classes</h2><p class="muted">A teacher can work with multiple classes and roles.</p></div><button class="primary-button" id="add-class">+ Add Class</button></div><div class="cards">'+(s.classes.length?s.classes.map(c=>'<div class="card"><h3>'+esc(c.name)+'</h3><p>'+c.students.length+' active students</p><p class="muted">'+esc(c.role||"Subject Teacher")+'</p><div class="card-action"><button class="small-button" data-open-class="'+c.id+'">Open</button></div></div>').join(""):'<div class="card"><h3>No classes</h3><p>Create a class or add a subject assignment.</p></div>')+'</div>';
 document.querySelector("#add-class").onclick=()=>renderAddClass();document.querySelectorAll("[data-open-class]").forEach(b=>b.onclick=()=>renderClass(b.dataset.openClass));
}
function renderAddClass(){
 page.innerHTML='<div class="section-heading"><div><h2>Add Class</h2><p class="muted">Choose the teacher role for this class.</p></div></div><form class="form-card" id="class-form"><div class="form-grid"><label>Class name<input name="name" placeholder="SS1" required></label><label>Your role<select name="role"><option value="CLASS_MASTER">Class Master</option><option value="SUBJECT_TEACHER">Subject Teacher</option></select></label></div><div class="form-actions"><button class="primary-button">Create class</button></div></form>';
 document.querySelector("#class-form").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget);const s=state();s.classes.push({id:id("class"),name:String(d.get("name")).trim(),role:String(d.get("role")),students:[]});write(s);renderClasses()};
}
function renderClass(classId){
 const s=state(), c=s.classes.find(x=>x.id===classId);if(!c)return renderClasses();
 const canRoster=c.role==="CLASS_MASTER";
 page.innerHTML='<div class="section-heading"><div><h2>'+esc(c.name)+'</h2><p class="muted">'+c.students.length+' students</p></div>'+(canRoster?'<div class="card-action"><button class="primary-button" id="attendance">Attendance</button> <button class="primary-button" id="add-student">+ Add Student</button></div>':"")+'</div><div class="card"><h3>Class role</h3><p>'+(canRoster?"Class Master — roster and attendance authority.":"Subject Teacher — subject work only; class roster remains with the Class Master.")+'</p></div><div class="card"><h3>Students</h3>'+(c.students.length?c.students.map(st=>'<div class="student-row"><div><strong>'+esc(st.name)+'</strong><div class="student-id">'+esc(st.studentId)+' · '+esc(st.sex)+'</div></div><span class="chip">'+esc(st.status||"ACTIVE")+'</span></div>').join(""):'<div class="empty">No local students in this class yet.</div>')+'</div>';
 if(canRoster){
  document.querySelector("#add-student").onclick=()=>renderAddStudent(classId);
  document.querySelector("#attendance").onclick=()=>renderAttendance(classId);
 }
}
function renderAttendance(classId){
 const s=state(), c=s.classes.find(x=>x.id===classId);if(!c||c.role!=="CLASS_MASTER")return renderClasses();
 const today=new Date().toISOString().slice(0,10);
 const records=Array.isArray(s.attendance)?s.attendance:[];
 page.innerHTML='<div class="section-heading"><div><h2>Attendance</h2><p class="muted">'+esc(c.name)+' · Tick students present</p></div><button class="small-button" id="back-attendance">Back</button></div>'+
 '<form class="form-card" id="attendance-form"><div class="form-grid"><label>Date<input name="date" type="date" value="'+today+'" required></label><label>Term<select name="term"><option>First Term</option><option>Second Term</option><option>Third Term</option></select></label></div>'+
 '<div class="card"><h3>Students</h3>'+(c.students.length?c.students.map(st=>'<label class="student-row"><div><strong>'+esc(st.name)+'</strong><div class="student-id">'+esc(st.studentId)+'</div></div><input class="attendance-check" type="checkbox" name="present" value="'+esc(st.studentId)+'" aria-label="Present '+esc(st.name)+'"></label>').join(""):'<div class="empty">No students in this class yet.</div>')+
 '</div><div class="form-actions"><button class="primary-button">Save Attendance</button></div><p class="form-message" id="attendance-message"></p></form>'+
 '<div class="card"><h3>Attendance totals</h3><div class="form-grid"><label>Period<select id="attendance-period"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="termly">Termly</option><option value="yearly">Yearly</option></select></label><div></div></div><div id="attendance-summary"></div></div>';
 const form=document.querySelector("#attendance-form"),dateInput=form.querySelector("[name=date]"),termInput=form.querySelector("[name=term]"),periodInput=document.querySelector("#attendance-period");
 function periodDates(date,period){
  const d=new Date(date+"T00:00:00"),start=new Date(d),end=new Date(d);
  if(period==="daily")return [date,date];
  if(period==="weekly"){const day=d.getDay();start.setDate(d.getDate()-(day===0?6:day-1));end.setTime(start.getTime());end.setDate(start.getDate()+6);}
  if(period==="monthly"){start.setDate(1);end.setMonth(d.getMonth()+1,0);}
  if(period==="yearly"){start.setMonth(0,1);end.setMonth(11,31);}
  if(period==="termly"){start.setMonth(0,1);end.setMonth(11,31);}
  return [start.toISOString().slice(0,10),end.toISOString().slice(0,10)];
 }
 function renderSummary(){
  const date=dateInput.value,period=periodInput.value,[from,to]=periodDates(date,period),term=termInput.value;
  const rows=records.filter(r=>r.classId===classId&&r.date>=from&&r.date<=to&&(period!=="termly"||(!r.term||r.term===term)));
  const unique=new Map();
  rows.forEach(r=>unique.set(r.date+"|"+r.studentId,r));
  const vals=[...unique.values()],present=vals.filter(r=>r.status==="PRESENT").length,absent=vals.filter(r=>r.status==="ABSENT").length;
  const maleIds=new Set(c.students.filter(st=>st.sex==="Male").map(st=>st.studentId)),femaleIds=new Set(c.students.filter(st=>st.sex==="Female").map(st=>st.studentId));
  const m=new Set(vals.filter(r=>maleIds.has(r.studentId)).map(r=>r.studentId)).size;
  const f=new Set(vals.filter(r=>femaleIds.has(r.studentId)).map(r=>r.studentId)).size;
  const rate=vals.length?Math.round((present/vals.length)*100):0;
  document.querySelector("#attendance-summary").innerHTML='<div class="attendance-summary-grid"><div><span>Total</span><strong>'+vals.length+'</strong></div><div><span>M</span><strong>'+m+'</strong></div><div><span>F</span><strong>'+f+'</strong></div><div><span>Present</span><strong>'+present+'</strong></div><div><span>Absent</span><strong>'+absent+'</strong></div><div><span>Rate</span><strong>'+rate+'%</strong></div></div><p class="muted">Records: '+esc(from)+' to '+esc(to)+'</p>';
 }
 function loadDate(){
  const saved=records.filter(r=>r.classId===classId&&r.date===dateInput.value);
  const present=new Set(saved.filter(r=>r.status==="PRESENT").map(r=>r.studentId));
  if(saved.length&&saved[0].term)termInput.value=saved[0].term;
  form.querySelectorAll("[name=present]").forEach(box=>box.checked=present.has(box.value));
  document.querySelector("#attendance-message").textContent=saved.length?"Saved attendance: ticked = PRESENT, unticked = ABSENT.":"";
  renderSummary();
 }
 dateInput.onchange=loadDate;termInput.onchange=()=>{loadDate()};periodInput.onchange=renderSummary;loadDate();
 document.querySelector("#back-attendance").onclick=()=>renderClass(classId);
 form.onsubmit=e=>{
  e.preventDefault();
  const st=state(),date=String(dateInput.value),term=String(termInput.value),picked=new Set([...form.querySelectorAll("[name=present]:checked")].map(x=>x.value));
  st.attendance=Array.isArray(st.attendance)?st.attendance:[];
  st.attendance=st.attendance.filter(r=>!(r.classId===classId&&r.date===date));
  c.students.forEach(student=>st.attendance.push({id:id("attendance"),classId,studentId:student.studentId,date,term,status:picked.has(student.studentId)?"PRESENT":"ABSENT",updatedAt:new Date().toISOString()}));
  write(st);renderAttendance(classId);
 };
}
function renderSubjects(){
 const s=state();if(!s.teacher)return renderHome();
 page.innerHTML='<div class="section-heading"><div><h2>Subjects</h2><p class="muted">Subject → Class → Students. A teacher may teach one subject in many classes.</p></div><button class="primary-button" id="add-subject">+ Add Subject</button></div><div class="cards">'+(s.subjects.length?s.subjects.map(x=>'<div class="card"><h3>'+esc(x.name)+'</h3><p>'+esc(x.className)+' · '+x.studentIds.length+' students</p><div class="card-action"><button class="small-button" data-open-subject="'+x.id+'">Open</button></div></div>').join(""):'<div class="card"><h3>No subjects yet</h3><p>Add a subject to a class.</p></div>')+'</div>';
 document.querySelector("#add-subject").onclick=renderAddSubject;document.querySelectorAll("[data-open-subject]").forEach(b=>b.onclick=()=>renderSubject(b.dataset.openSubject));
}
function renderAddSubject(){
 const s=state();
 page.innerHTML='<div class="section-heading"><div><h2>Add Subject</h2><p class="muted">By default, the whole class offers the subject. You can select only those who do.</p></div></div><form class="form-card" id="subject-form"><div class="form-grid"><label>Subject name<input name="name" required></label><label>Class<select name="classId" required>'+s.classes.map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join("")+'</select></label></div><div id="subject-students"></div><div class="form-actions"><button class="primary-button">Create subject</button></div></form>';
 const select=document.querySelector("[name=classId]"), box=document.querySelector("#subject-students");
 function draw(){const c=s.classes.find(x=>x.id===select.value);if(!c){box.innerHTML='<p class="muted">Create a class first.</p>';return}box.innerHTML='<label>Students<select name="membership" id="membership"><option value="ALL">Whole class</option><option value="SELECTED">Select students</option></select></label><div id="student-picker"></div>';const membership=document.querySelector("#membership");const picker=document.querySelector("#student-picker");membership.onchange=()=>{picker.innerHTML=membership.value==="SELECTED"?c.students.map(st=>'<label><span><input type="checkbox" name="student" value="'+esc(st.studentId)+'" checked> '+esc(st.name)+'</span></label>').join(""):""};membership.onchange()}
 select.onchange=draw;draw();
 document.querySelector("#subject-form").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),c=s.classes.find(x=>x.id===d.get("classId"));const ids=d.get("membership")==="ALL"?c.students.filter(x=>x.status==="ACTIVE").map(x=>x.studentId):d.getAll("student");s.subjects.push({id:id("subject"),name:String(d.get("name")).trim(),classId:c.id,className:c.name,studentIds:ids});write(s);renderSubjects()};
}
function gradeFromPercentage(percent){
 if(percent>=70)return "A";
 if(percent>=60)return "B";
 if(percent>=50)return "C";
 if(percent>=45)return "D";
 if(percent>=40)return "E";
 return "F";
}
function studentCA(subjectId,studentId){
 const s=state();
 return (Array.isArray(s.ca)?s.ca:[])
  .filter(a=>a.subjectId===subjectId)
  .reduce((sum,a)=>{
   const row=(a.scores||[]).find(v=>v.studentId===studentId);
   return sum+(row?Number(row.score)||0:0);
  },0);
}
function studentCAMax(subjectId){
 const s=state();
 return (Array.isArray(s.ca)?s.ca:[])
  .filter(a=>a.subjectId===subjectId)
  .reduce((sum,a)=>sum+(Number(a.maximumScore)||0),0);
}
function studentExam(subjectId,studentId){
 const s=state();
 return (Array.isArray(s.exams)?s.exams:[])
  .filter(a=>a.subjectId===subjectId)
  .reduce((sum,a)=>{
   const row=(a.scores||[]).find(v=>v.studentId===studentId);
   return sum+(row?Number(row.score)||0:0);
  },0);
}
function studentExamMax(subjectId){
 const s=state();
 return (Array.isArray(s.exams)?s.exams:[])
  .filter(a=>a.subjectId===subjectId)
  .reduce((sum,a)=>sum+(Number(a.maximumScore)||0),0);
}
function renderSubject(subjectId){
 const s=state(),x=s.subjects.find(v=>v.id===subjectId);if(!x)return renderSubjects();
 const c=s.classes.find(v=>v.id===x.classId);
 const students=(c?.students||[]).filter(st=>x.studentIds.includes(st.studentId));
 const ca=Array.isArray(s.ca)?s.ca.filter(v=>v.subjectId===x.id):[];
 const exams=Array.isArray(s.exams)?s.exams.filter(v=>v.subjectId===x.id):[];
 const caMax=studentCAMax(x.id),examMax=studentExamMax(x.id);
 page.innerHTML='<div class="section-heading"><div><h2>'+esc(x.name)+'</h2><p class="muted">'+esc(x.className)+' · '+students.length+' students</p></div><button class="small-button" id="back-subjects">Back</button></div>'+
 '<div class="card"><h3>Subject role</h3><p>Subject Teacher — CA, exams and results for assigned students.</p><div class="card-action"><button class="primary-button" id="add-ca">+ Add CA</button> <button class="primary-button" id="add-exam">+ Add Exam</button></div></div>'+
 '<div class="card"><h3>Students</h3><p class="muted">CA is calculated from every CA added for this subject. Add CA1, CA2, CA3, CA4 or more — the CA total updates automatically.</p>'+
 (students.length?'<div class="student-results">'+students.map(st=>{
   const caScore=studentCA(x.id,st.studentId);
   const examScore=studentExam(x.id,st.studentId);
   const examEntered=hasExamEntry(x.id,st.studentId);
   const total=caScore+examScore;
   const overallMax=caMax+examMax;
   const specialZeroExam=examEntered&&examMax===0&&examScore===0;
   const grade=!examEntered?"—":specialZeroExam?"S":overallMax>0?gradeFromPercentage((total/overallMax)*100):"—";
   return '<div class="student-result-row"><div class="student-result-main"><strong>'+esc(st.name)+'</strong><div class="student-id">'+esc(st.studentId)+' · '+esc(st.sex)+' · '+esc(st.status||"ACTIVE")+'</div></div><div class="result-number"><span class="result-label">CA</span><strong>'+caScore+'</strong><small>/ '+caMax+'</small></div><div class="result-number"><span class="result-label">EXAM</span><strong>'+(examEntered?examScore:"—")+'</strong><small>'+ (examEntered?"/ "+examMax:"/ —") +'</small></div><div class="result-number total"><span class="result-label">TOTAL</span><strong>'+total+'</strong><small>/ '+overallMax+'</small></div><div class="result-grade"><span class="result-label">GRADE</span><strong>'+grade+'</strong></div></div>';
 }).join(""):'<div class="empty">No students assigned to this subject.</div>')+'</div></div>'+
 '<div class="card"><h3>CA assessments</h3>'+
 (ca.length?ca.map(a=>{
   const count=(a.scores||[]).length;
   return '<div class="student-row"><div><strong>'+esc(a.name)+'</strong><div class="student-id">Maximum score: '+esc(a.maximumScore)+' · '+count+' scores</div></div><button class="small-button" data-open-ca="'+a.id+'">Open</button></div>';
 }).join(""):'<div class="empty">No CA assessment yet.</div>')+
 (exams.length?exams.map(a=>{const count=(a.scores||[]).length;return '<div class="student-row"><div><strong>'+esc(a.name||"EXAM")+'</strong><div class="student-id">Maximum score: '+esc(a.maximumScore)+' · '+count+' scores</div></div><button class="small-button" data-open-exam="'+a.id+'">Open</button></div>';}).join(""):'<div class="empty">No Exam yet.</div>')+'</div>';
 document.querySelector("#back-subjects").onclick=renderSubjects;
 document.querySelector("#add-ca").onclick=()=>renderAddCA(subjectId);
 const examButton=document.querySelector("#add-exam");
 examButton.textContent=exams.length?"Open Exam":"+ Add Exam";
 examButton.onclick=()=>exams.length?renderExam(exams[0].id):renderAddExam(subjectId);
 document.querySelectorAll("[data-open-ca]").forEach(b=>b.onclick=()=>renderCA(b.dataset.openCa));
 document.querySelectorAll("[data-open-exam]").forEach(b=>b.onclick=()=>renderExam(b.dataset.openExam));
}
function renderAddExam(subjectId){
 const s=state(),x=s.subjects.find(v=>v.id===subjectId);if(!x)return renderSubjects();
 const existing=(Array.isArray(s.exams)?s.exams:[]).find(v=>v.subjectId===x.id);
 if(existing)return renderExam(existing.id);
 page.innerHTML='<div class="section-heading"><div><h2>Add Exam</h2><p class="muted">'+esc(x.name)+' · '+esc(x.className)+'</p></div><button class="small-button" id="back-exam">Back</button></div><form class="form-card" id="exam-form"><div class="form-grid"><label>Exam name<input name="name" value="EXAM" required></label><label>Maximum score<input name="maximumScore" type="number" min="1" step="1" value="60" required></label><label>Date<input name="date" type="date" value="2026-10-04" required></label></div><div class="form-actions"><button class="primary-button">Create Exam &amp; Add Scores</button></div><p class="form-message" id="exam-message"></p></form>';
 document.querySelector("#back-exam").onclick=()=>renderSubject(subjectId);
 document.querySelector("#exam-form").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),maximumScore=Number(d.get("maximumScore"));if(!Number.isFinite(maximumScore)||maximumScore<=0){document.querySelector("#exam-message").textContent="Maximum score must be greater than zero.";return}const st=state();st.exams=Array.isArray(st.exams)?st.exams:[];if(st.exams.some(v=>v.subjectId===x.id)){return renderExam(st.exams.find(v=>v.subjectId===x.id).id)}const exam={id:id("exam"),subjectId:x.id,classId:x.classId,name:"EXAM",maximumScore,date:String(d.get("date")),scores:[]};st.exams.push(exam);write(st);renderExam(exam.id)};
}
function renderExam(examId){
 const s=state(),a=(s.exams||[]).find(v=>v.id===examId);if(!a)return renderSubjects();
 const x=s.subjects.find(v=>v.id===a.subjectId),c=s.classes.find(v=>v.id===a.classId),students=(c?.students||[]).filter(st=>x?.studentIds.includes(st.studentId));
 const values=new Map((a.scores||[]).map(v=>[v.studentId,v.score]));
 page.innerHTML='<div class="section-heading"><div><h2>EXAM</h2><p class="muted">'+esc(x?.name||"Subject")+' · '+esc(x?.className||"Class")+' · Max '+esc(a.maximumScore)+' · '+esc(a.date)+'</p></div><button class="small-button" id="back-exam">Back</button></div><div class="card"><h3>Exam</h3><p>This is the single exam record for this subject. Enter one score for each student.</p></div><form class="form-card" id="exam-scores"><h3>Enter exam scores</h3>'+(students.length?students.map(st=>'<div class="score-row"><div class="score-student"><strong>'+esc(st.name)+'</strong><span class="student-id">'+esc(st.studentId)+'</span></div><input class="score-input" name="score-'+esc(st.studentId)+'" type="number" min="0" max="'+esc(a.maximumScore)+'" step="0.01" value="'+esc(values.get(st.studentId)??"")+'" placeholder="0 - '+esc(a.maximumScore)+'" aria-label="Exam score for '+esc(st.name)+'"></div>').join(""):'<p class="empty">No students assigned to this subject.</p>')+'<div class="form-actions"><button class="primary-button">Save Exam Scores</button></div><p class="form-message" id="exam-score-message"></p></form>';
 document.querySelector("#back-exam").onclick=()=>renderSubject(a.subjectId);
 document.querySelector("#exam-scores").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),st=state();const scores=[];for(const student of students){const raw=d.get("score-"+student.studentId);if(raw===null||String(raw).trim()==="")continue;const score=Number(raw);if(!Number.isFinite(score)||score<0||score>a.maximumScore){document.querySelector("#exam-score-message").textContent="Each score must be between 0 and the exam maximum.";return}scores.push({studentId:student.studentId,score,updatedAt:new Date().toISOString()})}const saved=st.exams.find(v=>v.id===examId);if(!saved)return renderSubjects();saved.scores=scores;write(st);renderSubject(a.subjectId);};
}
function renderAddCA(subjectId){
 const s=state(),x=s.subjects.find(v=>v.id===subjectId);if(!x)return renderSubjects();
 page.innerHTML='<div class="section-heading"><div><h2>Add CA</h2><p class="muted">'+esc(x.name)+' · '+esc(x.className)+'</p></div><button class="small-button" id="back-ca">Back</button></div><form class="form-card" id="ca-form"><div class="form-grid"><label>Assessment name<input name="name" placeholder="CA 1" required></label><label>Maximum score<input name="maximumScore" type="number" min="1" step="1" value="20" required></label><label>Date<input name="date" type="date" value="2026-10-04" required></label></div><div class="form-actions"><button class="primary-button">Create CA</button></div><p class="form-message" id="ca-message"></p></form>';
 document.querySelector("#back-ca").onclick=()=>renderSubject(subjectId);
 document.querySelector("#ca-form").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),maximumScore=Number(d.get("maximumScore"));if(!Number.isFinite(maximumScore)||maximumScore<=0){document.querySelector("#ca-message").textContent="Maximum score must be greater than zero.";return}const st=state();st.ca=Array.isArray(st.ca)?st.ca:[];st.ca.push({id:id("ca"),subjectId:x.id,classId:x.classId,name:String(d.get("name")).trim(),maximumScore,date:String(d.get("date")),scores:[]});write(st);renderCA(st.ca[st.ca.length-1].id)};
}
function renderCA(caId){
 const s=state(),a=(s.ca||[]).find(v=>v.id===caId);if(!a)return renderSubjects();
 const x=s.subjects.find(v=>v.id===a.subjectId),c=s.classes.find(v=>v.id===a.classId),students=(c?.students||[]).filter(st=>x?.studentIds.includes(st.studentId));
 const values=new Map((a.scores||[]).map(v=>[v.studentId,v.score]));
 page.innerHTML='<div class="section-heading"><div><h2>'+esc(a.name)+'</h2><p class="muted">'+esc(x?.name||"Subject")+' · '+esc(x?.className||"Class")+' · Max '+esc(a.maximumScore)+' · '+esc(a.date)+'</p></div><button class="small-button" id="back-ca">Back</button></div><div class="card"><h3>CA details</h3><p>These details belong to this CA record. Edit them here when correction is needed.</p><div class="card-action"><button class="small-button" id="edit-ca-details">Edit CA details</button></div></div><form class="form-card" id="ca-scores"><h3>Edit student scores</h3>'+(students.length?students.map(st=>'<div class="score-row"><div class="score-student"><strong>'+esc(st.name)+'</strong><span class="student-id">'+esc(st.studentId)+'</span></div><input class="score-input" name="score-'+esc(st.studentId)+'" type="number" min="0" max="'+esc(a.maximumScore)+'" step="0.01" value="'+esc(values.get(st.studentId)??"")+'" placeholder="0 - '+esc(a.maximumScore)+'" aria-label="Score for '+esc(st.name)+'"></div>').join(""):'<p class="empty">No students assigned to this subject.</p>')+'<div class="form-actions"><button class="primary-button">Save Corrections</button></div><p class="form-message" id="ca-score-message"></p></form>';
 document.querySelector("#back-ca").onclick=()=>renderSubject(a.subjectId);
 document.querySelector("#edit-ca-details").onclick=()=>renderEditCA(caId);
 document.querySelector("#ca-scores").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),st=state();const scores=[];for(const student of students){const raw=d.get("score-"+student.studentId);if(raw===null||String(raw).trim()==="")continue;const score=Number(raw);if(!Number.isFinite(score)||score<0||score>a.maximumScore){document.querySelector("#ca-score-message").textContent="Each score must be between 0 and the assessment maximum.";return}scores.push({studentId:student.studentId,score,updatedAt:new Date().toISOString()})}const saved=st.ca.find(v=>v.id===caId);if(!saved)return renderSubjects();saved.scores=scores;write(st);renderSubject(a.subjectId);};
}
function renderEditCA(caId){
 const s=state(),a=(s.ca||[]).find(v=>v.id===caId);if(!a)return renderSubjects();
 page.innerHTML='<div class="section-heading"><div><h2>Edit CA details</h2><p class="muted">Correct the existing assessment without creating another CA.</p></div><button class="small-button" id="back-edit-ca">Back</button></div><form class="form-card" id="edit-ca-form"><div class="form-grid"><label>Assessment name<input name="name" value="'+esc(a.name)+'" required></label><label>Maximum score<input name="maximumScore" type="number" min="1" step="1" value="'+esc(a.maximumScore)+'" required></label><label>Date<input name="date" type="date" value="'+esc(a.date)+'" required></label></div><div class="form-actions"><button class="primary-button">Save CA details</button></div><p class="form-message" id="edit-ca-message"></p></form>';
 document.querySelector("#back-edit-ca").onclick=()=>renderCA(caId);
 document.querySelector("#edit-ca-form").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),maximumScore=Number(d.get("maximumScore"));if(!Number.isFinite(maximumScore)||maximumScore<=0){document.querySelector("#edit-ca-message").textContent="Maximum score must be greater than zero.";return}const st=state(),saved=st.ca.find(v=>v.id===caId);if(!saved)return renderSubjects();saved.name=String(d.get("name")).trim();saved.maximumScore=maximumScore;saved.date=String(d.get("date"));saved.scores=(saved.scores||[]).filter(v=>Number(v.score)<=maximumScore);write(st);renderCA(caId);};
}
function renderConnect(){page.innerHTML='<div class="section-heading"><div><h2>Connect to School</h2><p class="muted">Pair with Admin when a school workspace is available. Normal Teacher work remains local.</p></div></div><div class="card"><h3>Connection foundation</h3><p>Pairing and sync will use the shared SkulGo identity/assignment contracts. This screen is intentionally small until the connection flow is implemented.</p></div>'}
function render(section){
 nav.forEach(b=>b.classList.toggle("active",b.dataset.section===section));
 title.textContent=labels[section]||"Home";
 if(section==="home") renderHome();
 else if(section==="classes") renderClasses();
 else if(section==="subjects") renderSubjects();
 else if(section==="received") page.innerHTML='<div class="card"><h2>Received</h2><p class="muted">Incoming subject records will appear here. Share and QR transport will be added after the local record flow is frozen.</p></div>';
 else if(section==="connect") renderConnect();
 else if(section==="grade-band") renderGradeBand();
 else if(section==="settings") page.innerHTML='<div class="card"><h2>Settings</h2><p class="muted">Teacher profile and local workspace settings.</p></div>';
 else renderHome();
 sidebar.classList.remove("open");
}
nav.forEach(b=>b.onclick=()=>render(b.dataset.section));menu.onclick=()=>sidebar.classList.toggle("open");render("home");
