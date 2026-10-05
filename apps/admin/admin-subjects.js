/* Admin Subject workspace — mirrors the proven Teacher Subject flow.
   Teacher code is untouched. Admin remains authoritative and can edit all subject records. */
(function () {
  const KEY = "skulgo.admin.subject-assessments.v1";

  function defs() {
    try {
      const v = JSON.parse(readStorage(KEY) || "[]");
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  }
  function saveDefs(v) { writeStorage(KEY, JSON.stringify(v)); }
  function context(school, classId, subjectId) {
    return {
      sessionId: school.session?.sessionId || school.session?.name || "",
      termId: school.term?.termId || school.term?.name || "",
      key: [school.schoolId, classId, subjectId, school.session?.sessionId || school.session?.name || "", school.term?.termId || school.term?.name || ""].join("|")
    };
  }
  function recordsFor(school, classId, subjectId) {
    const c = context(school, classId, subjectId);
    return loadResultsRecords().filter(r =>
      r.schoolId === school.schoolId && r.classId === classId && r.subjectId === subjectId &&
      String(r.sessionId || "") === String(c.sessionId) && String(r.termId || "") === String(c.termId)
    );
  }
  function studentsFor(school, classId) {
    return loadStore().students.filter(s => s.schoolId === school.schoolId && s.classId === classId);
  }
  function caDefs(school, classId, subjectId) {
    const c = context(school, classId, subjectId);
    const map = new Map(defs().filter(x => x.key === c.key && x.kind === "ca").map(x => [x.name, x]));
    for (const r of recordsFor(school, classId, subjectId)) {
      for (const a of (r.caAssessments || [])) {
        if (!map.has(a.name)) map.set(a.name, { id: id("ca"), key: c.key, kind: "ca", name: a.name, maximumScore: Number(a.maximumScore || 20), date: a.date || "" });
      }
    }
    return [...map.values()].sort((a,b) => String(a.name).localeCompare(String(b.name), undefined, {numeric:true}));
  }
  function examDef(school, classId, subjectId) {
    const c = context(school, classId, subjectId);
    const saved = defs().find(x => x.key === c.key && x.kind === "exam");
    if (saved) return saved;
    const r = recordsFor(school, classId, subjectId).find(x => x.exam !== undefined);
    return r ? {id:id("exam"), key:c.key, kind:"exam", name:r.examName || "EXAM", maximumScore:Number(r.examMaximum || 60), date:r.examDate || ""} : null;
  }
  function upsert(d) {
    const all = defs();
    const i = all.findIndex(x => x.id === d.id);
    if (i >= 0) all[i] = {...all[i], ...d}; else all.push(d);
    saveDefs(all);
  }
  function esc(v) { return escapeHtml(v); }

  window.renderSubjects = function () {
    const school = loadSchool();
    if (!school) { page.innerHTML = "<h2>Subjects</h2><p class='muted'>Set up the school before managing subjects.</p>"; return; }
    const subjects = loadSubjects().filter(x => x.schoolId === school.schoolId && x.status === "ACTIVE");
    const classes = loadClasses().filter(x => x.schoolId === school.schoolId);
    const assignments = loadAssignments().filter(x => x.schoolId === school.schoolId && x.status === "ACTIVE" && x.assignmentType === "SUBJECT_TEACHER");
    const cards = [];
    const seen = new Set();
    for (const a of assignments) {
      const subject = subjects.find(x => x.subjectId === a.subjectId);
      const cls = classes.find(x => x.classId === a.classId);
      if (!subject || !cls) continue;
      const k = subject.subjectId + "|" + cls.classId;
      if (seen.has(k)) continue;
      seen.add(k);
      cards.push({subject, cls, count:studentsFor(school, cls.classId).length});
    }
    page.innerHTML = `
      <div class="section-heading"><div><h2>Subjects</h2><p class="muted">Subject → Class → Students. Admin manages the official subject records.</p></div><button class="primary-button" id="admin-new-subject">+ Add Subject</button></div>
      <div id="admin-subject-form"></div>
      <div class="cards">${cards.length ? cards.map(x => `
        <div class="card"><div class="section-heading"><div><h3>${esc(x.subject.name)}</h3><p class="muted">${esc(x.cls.name)} · ${x.count} students</p></div><button class="small-button" data-admin-open-subject="${esc(x.subject.subjectId)}" data-admin-open-class="${esc(x.cls.classId)}">Open</button></div></div>`).join("") : '<div class="empty">No subject teaching assignments yet.</div>'}</div>`;
    document.querySelector("#admin-new-subject").onclick = () => {
      document.querySelector("#admin-subject-form").innerHTML = `<form class="form-card" id="admin-subject-create"><div class="form-grid"><label>Subject name<input name="name" placeholder="Mathematics" required></label></div><div class="form-actions"><button class="primary-button">Save subject</button></div></form>`;
      document.querySelector("#admin-subject-create").onsubmit = e => {
        e.preventDefault(); const name = String(new FormData(e.currentTarget).get("name") || "").trim(); if (!name) return;
        const all = loadSubjects(); all.push({subjectId:id("subject"), schoolId:school.schoolId, name, status:"ACTIVE", createdAt:new Date().toISOString()}); saveSubjects(all); renderSubjects();
      };
    };
    document.querySelectorAll("[data-admin-open-subject]").forEach(b => b.onclick = () => renderAdminSubject(b.dataset.adminOpenSubject, b.dataset.adminOpenClass));
  };

  function renderAdminSubject(subjectId, classId) {
    const school = loadSchool(), subject = loadSubjects().find(x => x.schoolId === school?.schoolId && x.subjectId === subjectId), cls = loadClasses().find(x => x.schoolId === school?.schoolId && x.classId === classId);
    if (!school || !subject || !cls) return renderSubjects();
    const students = studentsFor(school, classId), records = recordsFor(school, classId, subjectId), assessments = caDefs(school, classId, subjectId), exam = examDef(school, classId, subjectId), scale = loadGradeScale();
    page.innerHTML = `
      <div class="section-heading"><div><h2>Subjects</h2><h3>${esc(subject.name)}</h3><p class="muted">${esc(cls.name)}</p></div><button class="small-button" id="admin-subject-back">Back</button></div>
      <div class="card"><h3>Subject role</h3><p>Admin — CA, exams and results for this subject.</p><div class="form-actions"><button class="primary-button" id="admin-add-ca">+ Add CA</button><button class="primary-button" id="admin-open-exam">Open Exam</button></div></div>
      <div class="card"><h3>Students</h3><p class="muted">CA is calculated from every CA added for this subject. Add CA1, CA2, CA3, CA4 or more — the CA total updates automatically.</p>
      ${students.length ? '<div class="student-results">'+students.map(st => {
        const r=records.find(x=>x.studentId===st.studentId), ca=r ? (r.caAssessments||[]).reduce((n,a)=>n+Number(a.score||0),0) : undefined, camax=r ? (r.caAssessments||[]).reduce((n,a)=>n+Number(a.maximumScore||0),0) : undefined, total=r ? calculateResultTotal(r) : undefined, grade=calculateResultGrade(total,scale);
        return '<div class="student-result-row"><div class="student-result-main"><strong>'+esc(st.name)+'</strong><span class="student-id">'+esc(st.studentId||"")+' · '+esc(st.sex||st.gender||"")+' · '+esc(st.status||"ACTIVE")+'</span></div><div class="result-number"><span class="result-label">CA</span><strong>'+(ca??"—")+'</strong><small>/ '+(camax??"—")+'</small></div><div class="result-number"><span class="result-label">EXAM</span><strong>'+(r?.exam??"—")+'</strong><small>/ '+(r?.examMaximum??"—")+'</small></div><div class="result-number total"><span class="result-label">TOTAL</span><strong>'+(total??"—")+'</strong><small>/ '+((Number(camax||0)+Number(r?.examMaximum||0))||"—")+'</small></div><div class="result-grade"><span class="result-label">GRADE</span><strong>'+(grade??"—")+'</strong></div></div>';
      }).join("")+'</div>' : '<div class="empty">No students are enrolled in this class.</div>'}
      </div>
      <div class="card"><h3>CA assessments</h3>${assessments.length ? assessments.map(a => '<div class="student-row"><div><strong>'+esc(a.name)+'</strong><div class="student-id">Maximum score: '+esc(a.maximumScore)+' · '+records.filter(r=>(r.caAssessments||[]).some(x=>x.name===a.name)).length+' scores</div></div><button class="small-button" data-admin-ca="'+esc(a.id)+'">Open</button></div>').join("") : '<div class="empty">No CA assessment yet.</div>'}</div>
      <div class="card"><h3>Exam</h3>${exam ? '<div class="student-row"><div><strong>'+esc(exam.name||"EXAM")+'</strong><div class="student-id">Maximum score: '+esc(exam.maximumScore)+' · '+records.filter(r=>r.exam!==undefined).length+' scores</div></div><button class="small-button" id="admin-existing-exam">Open</button></div>' : '<div class="empty">No Exam yet.</div>'}</div>`;
    document.querySelector("#admin-subject-back").onclick=renderSubjects;
    document.querySelector("#admin-add-ca").onclick=()=>renderAdminAddCA(subjectId,classId);
    document.querySelector("#admin-open-exam").onclick=()=>exam?renderAdminExam(subjectId,classId):renderAdminAddExam(subjectId,classId);
    document.querySelector("#admin-existing-exam")?.addEventListener("click",()=>renderAdminExam(subjectId,classId));
    document.querySelectorAll("[data-admin-ca]").forEach(b=>b.onclick=()=>renderAdminCA(b.dataset.adminCa,subjectId,classId));
  }

  function renderAdminAddCA(subjectId,classId) {
    const school=loadSchool(), subject=loadSubjects().find(x=>x.subjectId===subjectId), cls=loadClasses().find(x=>x.classId===classId);
    if(!school||!subject||!cls)return renderSubjects();
    page.innerHTML=`<div class="section-heading"><div><h2>Add CA</h2><p class="muted">${esc(subject.name)} · ${esc(cls.name)}</p></div><button class="small-button" id="ca-back">Back</button></div><form class="form-card" id="ca-form"><div class="form-grid"><label>Assessment name<input name="name" placeholder="CA 1" required></label><label>Maximum score<input name="maximumScore" type="number" min="1" step="1" value="20" required></label><label>Date<input name="date" type="date" value="${new Date().toISOString().slice(0,10)}" required></label></div><div class="form-actions"><button class="primary-button">Create CA</button></div><p class="form-message" id="ca-message"></p></form>`;
    document.querySelector("#ca-back").onclick=()=>renderAdminSubject(subjectId,classId);
    document.querySelector("#ca-form").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),name=String(d.get("name")||"").trim(),maximumScore=Number(d.get("maximumScore")),date=String(d.get("date")||""),s=loadSchool(),c=context(s,classId,subjectId),msg=document.querySelector("#ca-message");if(!name||!Number.isFinite(maximumScore)||maximumScore<=0){msg.textContent="Assessment name and a valid maximum score are required.";return}if(caDefs(s,classId,subjectId).some(x=>x.name.toLowerCase()===name.toLowerCase())){msg.textContent="An assessment with this name already exists.";return}const a={id:id("ca"),key:c.key,kind:"ca",name,maximumScore,date};upsert(a);renderAdminCA(a.id,subjectId,classId)};
  }

  function renderAdminCA(assessmentId,subjectId,classId) {
    const school=loadSchool(),subject=loadSubjects().find(x=>x.subjectId===subjectId),cls=loadClasses().find(x=>x.classId===classId);if(!school||!subject||!cls)return renderSubjects();
    const c=context(school,classId,subjectId),a=caDefs(school,classId,subjectId).find(x=>x.id===assessmentId);if(!a)return renderAdminSubject(subjectId,classId);
    const students=studentsFor(school,classId),all=loadResultsRecords(),scoreFor=studentId=>all.find(r=>r.schoolId===school.schoolId&&r.classId===classId&&r.subjectId===subjectId&&r.studentId===studentId&&String(r.sessionId||"")===String(c.sessionId)&&String(r.termId||"")===String(c.termId))?.caAssessments?.find(x=>x.name===a.name)?.score;
    page.innerHTML=`<div class="section-heading"><div><h2>${esc(a.name)}</h2><p class="muted">${esc(subject.name)} · ${esc(cls.name)} · Max ${esc(a.maximumScore)} · ${esc(a.date)}</p></div><button class="small-button" id="ca-detail-back">Back</button></div><div class="card"><h3>CA details</h3><p>These details belong to this CA record. Edit them here when correction is needed.</p><div class="card-action"><button class="small-button" id="edit-ca">Edit CA details</button></div></div><form class="form-card" id="ca-scores"><h3>Edit student scores</h3>${students.length?students.map(st=>'<div class="score-row"><div class="score-student"><strong>'+esc(st.name)+'</strong><span class="student-id">'+esc(st.studentId||"")+'</span></div><input class="score-input" name="score-'+esc(st.studentId)+'" type="number" min="0" max="'+esc(a.maximumScore)+'" step="0.01" value="'+esc(scoreFor(st.studentId)??"")+'" placeholder="0 - '+esc(a.maximumScore)+'"></div>').join(""):'<p class="empty">No students assigned to this subject.</p>'}<div class="form-actions"><button class="primary-button">Save Corrections</button></div><p class="form-message" id="ca-score-message"></p></form>`;
    document.querySelector("#ca-detail-back").onclick=()=>renderAdminSubject(subjectId,classId);
    document.querySelector("#edit-ca").onclick=()=>renderAdminEditCA(a.id,subjectId,classId);
    document.querySelector("#ca-scores").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),msg=document.querySelector("#ca-score-message"),all=loadResultsRecords(),map=new Map(all.filter(r=>r.schoolId===school.schoolId&&r.classId===classId&&r.subjectId===subjectId&&String(r.sessionId||"")===String(c.sessionId)&&String(r.termId||"")===String(c.termId)).map(r=>[r.studentId,r]));for(const st of students){const raw=d.get("score-"+st.studentId);if(raw===null||String(raw).trim()==="")continue;const score=Number(raw);if(!Number.isFinite(score)||score<0||score>a.maximumScore){msg.textContent="Each score must be between 0 and the assessment maximum.";return}const old=map.get(st.studentId)||{},next=(old.caAssessments||[]).filter(x=>x.name!==a.name);next.push({name:a.name,score,maximumScore:Number(a.maximumScore),date:a.date});map.set(st.studentId,{...old,resultId:old.resultId||id("result"),schoolId:school.schoolId,classId,subjectId,studentId:st.studentId,sessionId:c.sessionId,termId:c.termId,caAssessments:next,ca:next.reduce((n,x)=>n+Number(x.score||0),0),caName:next.map(x=>x.name).join(", "),caMaximum:next.reduce((n,x)=>n+Number(x.maximumScore||0),0),caDate:a.date})}const untouched=all.filter(r=>!(r.schoolId===school.schoolId&&r.classId===classId&&r.subjectId===subjectId&&String(r.sessionId||"")===String(c.sessionId)&&String(r.termId||"")===String(c.termId)));writeStorage(RESULTS_STORAGE_KEY,JSON.stringify([...untouched,...map.values()]));renderAdminSubject(subjectId,classId)};
  }

  function renderAdminEditCA(idValue,subjectId,classId) {
    const school=loadSchool(),a=caDefs(school,classId,subjectId).find(x=>x.id===idValue);if(!school||!a)return renderAdminSubject(subjectId,classId);
    page.innerHTML=`<div class="section-heading"><div><h2>Edit CA details</h2><p class="muted">Correct the existing assessment without creating another CA.</p></div><button class="small-button" id="edit-ca-back">Back</button></div><form class="form-card" id="edit-ca-form"><div class="form-grid"><label>Assessment name<input name="name" value="${esc(a.name)}" required></label><label>Maximum score<input name="maximumScore" type="number" min="1" step="1" value="${esc(a.maximumScore)}" required></label><label>Date<input name="date" type="date" value="${esc(a.date)}" required></label></div><div class="form-actions"><button class="primary-button">Save CA details</button></div><p class="form-message" id="edit-ca-message"></p></form>`;
    document.querySelector("#edit-ca-back").onclick=()=>renderAdminCA(a.id,subjectId,classId);
    document.querySelector("#edit-ca-form").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),name=String(d.get("name")||"").trim(),maximumScore=Number(d.get("maximumScore")),date=String(d.get("date")||""),msg=document.querySelector("#edit-ca-message");if(!name||!Number.isFinite(maximumScore)||maximumScore<=0){msg.textContent="Assessment name and a valid maximum score are required.";return}const all=defs(),i=all.findIndex(x=>x.id===a.id);if(i>=0)all[i]={...all[i],name,maximumScore,date};saveDefs(all);const updated=loadResultsRecords().map(r=>{if(r.schoolId!==school.schoolId||r.classId!==classId||r.subjectId!==subjectId)return r;const next=(r.caAssessments||[]).map(x=>x.name===a.name?{...x,name,maximumScore,date}:x);return {...r,caAssessments:next,ca:next.reduce((n,x)=>n+Number(x.score||0),0),caName:next.map(x=>x.name).join(", "),caMaximum:next.reduce((n,x)=>n+Number(x.maximumScore||0),0),caDate:date}});writeStorage(RESULTS_STORAGE_KEY,JSON.stringify(updated));renderAdminCA(a.id,subjectId,classId)};
  }

  function renderAdminAddExam(subjectId,classId) {
    const school=loadSchool(),subject=loadSubjects().find(x=>x.subjectId===subjectId),cls=loadClasses().find(x=>x.classId===classId);if(!school||!subject||!cls)return renderSubjects();
    page.innerHTML=`<div class="section-heading"><div><h2>Add Exam</h2><p class="muted">${esc(subject.name)} · ${esc(cls.name)}</p></div><button class="small-button" id="exam-back">Back</button></div><form class="form-card" id="exam-form"><div class="form-grid"><label>Exam name<input name="name" value="EXAM" required></label><label>Maximum score<input name="maximumScore" type="number" min="1" step="1" value="60" required></label><label>Date<input name="date" type="date" value="${new Date().toISOString().slice(0,10)}" required></label></div><div class="form-actions"><button class="primary-button">Create Exam &amp; Add Scores</button></div><p class="form-message" id="exam-message"></p></form>`;
    document.querySelector("#exam-back").onclick=()=>renderAdminSubject(subjectId,classId);
    document.querySelector("#exam-form").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),school=loadSchool(),c=context(school,classId,subjectId),maximumScore=Number(d.get("maximumScore")),date=String(d.get("date")||""),existing=examDef(school,classId,subjectId),msg=document.querySelector("#exam-message");if(!Number.isFinite(maximumScore)||maximumScore<=0){msg.textContent="Maximum score must be greater than zero.";return}if(existing)return renderAdminExam(subjectId,classId);const a={id:id("exam"),key:c.key,kind:"exam",name:"EXAM",maximumScore,date};upsert(a);renderAdminExam(subjectId,classId)};
  }

  function renderAdminExam(subjectId,classId) {
    const school=loadSchool(),subject=loadSubjects().find(x=>x.subjectId===subjectId),cls=loadClasses().find(x=>x.classId===classId),exam=school&&examDef(school,classId,subjectId);if(!school||!subject||!cls)return renderSubjects();if(!exam)return renderAdminAddExam(subjectId,classId);
    const c=context(school,classId,subjectId),students=studentsFor(school,classId),all=loadResultsRecords(),scoreFor=idValue=>all.find(r=>r.schoolId===school.schoolId&&r.classId===classId&&r.subjectId===subjectId&&r.studentId===idValue&&String(r.sessionId||"")===String(c.sessionId)&&String(r.termId||"")===String(c.termId))?.exam;
    page.innerHTML=`<div class="section-heading"><div><h2>EXAM</h2><p class="muted">${esc(subject.name)} · ${esc(cls.name)} · Max ${esc(exam.maximumScore)} · ${esc(exam.date)}</p></div><button class="small-button" id="exam-detail-back">Back</button></div><div class="card"><h3>Exam</h3><p>This is the single exam record for this subject. Enter one score for each student.</p></div><form class="form-card" id="exam-scores"><h3>Enter exam scores</h3>${students.length?students.map(st=>'<div class="score-row"><div class="score-student"><strong>'+esc(st.name)+'</strong><span class="student-id">'+esc(st.studentId||"")+'</span></div><input class="score-input" name="score-'+esc(st.studentId)+'" type="number" min="0" max="'+esc(exam.maximumScore)+'" step="0.01" value="'+esc(scoreFor(st.studentId)??"")+'" placeholder="0 - '+esc(exam.maximumScore)+'"></div>').join(""):'<p class="empty">No students assigned to this subject.</p>'}<div class="form-actions"><button class="primary-button">Save Exam Scores</button></div><p class="form-message" id="exam-score-message"></p></form>`;
    document.querySelector("#exam-detail-back").onclick=()=>renderAdminSubject(subjectId,classId);
    document.querySelector("#exam-scores").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),msg=document.querySelector("#exam-score-message"),all=loadResultsRecords(),map=new Map(all.filter(r=>r.schoolId===school.schoolId&&r.classId===classId&&r.subjectId===subjectId&&String(r.sessionId||"")===String(c.sessionId)&&String(r.termId||"")===String(c.termId)).map(r=>[r.studentId,r]));for(const st of students){const raw=d.get("score-"+st.studentId);if(raw===null||String(raw).trim()==="")continue;const score=Number(raw);if(!Number.isFinite(score)||score<0||score>exam.maximumScore){msg.textContent="Each score must be between 0 and the exam maximum.";return}const old=map.get(st.studentId)||{};map.set(st.studentId,{...old,resultId:old.resultId||id("result"),schoolId:school.schoolId,classId,subjectId,studentId:st.studentId,sessionId:c.sessionId,termId:c.termId,exam:score,examName:exam.name||"EXAM",examMaximum:Number(exam.maximumScore),examDate:exam.date})}const untouched=all.filter(r=>!(r.schoolId===school.schoolId&&r.classId===classId&&r.subjectId===subjectId&&String(r.sessionId||"")===String(c.sessionId)&&String(r.termId||"")===String(c.termId)));writeStorage(RESULTS_STORAGE_KEY,JSON.stringify([...untouched,...map.values()]));renderAdminSubject(subjectId,classId)};
  }

  window.renderAdminSubject = renderAdminSubject;
})();