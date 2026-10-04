const labels={home:"Home",classes:"My Classes",subjects:"Subjects",received:"Received",connect:"Connect",settings:"Settings"};
const STORAGE="skulgo.teacher.workspace.v1";
const nav=document.querySelectorAll(".nav-item"), page=document.querySelector("#page"), title=document.querySelector("#page-title");
const menu=document.querySelector("#menu-button"), sidebar=document.querySelector("#sidebar");

function read(){try{return JSON.parse(localStorage.getItem(STORAGE)||"null")}catch{return null}}
function write(data){localStorage.setItem(STORAGE,JSON.stringify(data))}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function state(){return read()||{teacher:null,classes:[],subjects:[]}}
function id(p){return p+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7)}

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
 page.innerHTML='<div class="section-heading"><div><h2>'+esc(c.name)+'</h2><p class="muted">'+c.students.length+' students</p></div>'+(canRoster?'<button class="primary-button" id="add-student">+ Add Student</button>':"")+'</div><div class="card"><h3>Class role</h3><p>'+(canRoster?"Class Master — roster and attendance authority.":"Subject Teacher — subject work only; class roster remains with the Class Master.")+'</p></div><div class="card"><h3>Students</h3>'+(c.students.length?c.students.map(st=>'<div class="student-row"><div><strong>'+esc(st.name)+'</strong><div class="student-id">'+esc(st.studentId)+' · '+esc(st.sex)+'</div></div><span class="chip">'+esc(st.status||"ACTIVE")+'</span></div>').join(""):'<div class="empty">No local students in this class yet.</div>')+'</div>';
 if(canRoster)document.querySelector("#add-student").onclick=()=>renderAddStudent(classId);
}
function renderAddStudent(classId){
 page.innerHTML='<div class="section-heading"><div><h2>Add Student</h2><p class="muted">Student ID is generated locally for this class.</p></div></div><form class="form-card" id="student-form"><div class="form-grid"><label>Student name<input name="name" required></label><label>Sex<select name="sex"><option>Female</option><option>Male</option></select></label></div><div class="form-actions"><button class="primary-button">Add Student</button></div></form>';
 document.querySelector("#student-form").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),s=state(),c=s.classes.find(x=>x.id===classId);const n=c.students.length+1;c.students.push({studentId:c.name+"/"+new Date().getFullYear()+"/"+String(n).padStart(4,"0"),name:String(d.get("name")).trim(),sex:String(d.get("sex")),status:"ACTIVE"});write(s);renderClass(classId)};
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
function renderSubject(subjectId){\n const s=state(),x=s.subjects.find(v=>v.id===subjectId);if(!x)return renderSubjects();\n const c=s.classes.find(v=>v.id===x.classId);const students=(c?.students||[]).filter(st=>x.studentIds.includes(st.studentId));\n page.innerHTML='<div class="section-heading"><div><h2>'+esc(x.name)+'</h2><p class="muted">'+esc(x.className)+' · '+students.length+' students</p></div><button class="small-button" id="back-subjects">Back</button></div><div class="card"><h3>Subject role</h3><p>Subject Teacher — CA, exams and results for assigned students.</p></div><div class="card"><h3>Students</h3>'+(students.length?students.map(st=>'<div class="student-row"><div><strong>'+esc(st.name)+'</strong><div class="student-id">'+esc(st.studentId)+' · '+esc(st.sex)+'</div></div><span class="chip">'+esc(st.status||"ACTIVE")+'</span></div>').join(""):'<div class="empty">No students assigned to this subject.</div>')+'</div>';\n document.querySelector("#back-subjects").onclick=renderSubjects;\n}\nfunction renderConnect(){page.innerHTML='<div class="section-heading"><div><h2>Connect to School</h2><p class="muted">Pair with Admin when a school workspace is available. Normal Teacher work remains local.</p></div></div><div class="card"><h3>Connection foundation</h3><p>Pairing and sync will use the shared SkulGo identity/assignment contracts. This screen is intentionally small until the connection flow is implemented.</p></div>'}
function render(section){
 nav.forEach(b=>b.classList.toggle("active",b.dataset.section===section));
 title.textContent=labels[section]||"Home";
 if(section==="home") renderHome();
 else if(section==="classes") renderClasses();
 else if(section==="subjects") renderSubjects();
 else if(section==="received") page.innerHTML='<div class="card"><h2>Received</h2><p class="muted">Incoming subject records will appear here. Share and QR transport will be added after the local record flow is frozen.</p></div>';
 else if(section==="connect") renderConnect();
 else if(section==="settings") page.innerHTML='<div class="card"><h2>Settings</h2><p class="muted">Teacher profile and local workspace settings.</p></div>';
 else renderHome();
 sidebar.classList.remove("open");
}
nav.forEach(b=>b.onclick=()=>render(b.dataset.section));menu.onclick=()=>sidebar.classList.toggle("open");render("home");
