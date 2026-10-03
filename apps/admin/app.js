const labels = {
  school: ["School", "School setup"],
  students: ["Students", "Students"],
  classes: ["Classes", "Classes"],
  subjects: ["Subjects", "Subjects"],
  teachers: ["Teachers", "Teachers"],
  attendance: ["Attendance", "Attendance"],
  results: ["Results", "Results"],
  fees: ["Fees", "Fees"],
  cashier: ["Cashier", "Cashier"],
  messaging: ["Messaging", "Messaging"],
};

const STORAGE_KEY = "skulgo.admin.admission-students.v1";

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"admissions":[],"students":[]}');
  } catch {
    return { admissions: [], students: [] };
  }
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const nav = document.querySelectorAll(".nav-item");
const title = document.querySelector("#page-title");
const page = document.querySelector("#page");

function renderSchool() {
  page.innerHTML = `
    <h2>School setup</h2>
    <p class="muted">Manage the school's identity and current academic period.</p>
    <div class="info-grid">
      <div class="info-card"><span>School</span><strong>Your school</strong></div>
      <div class="info-card"><span>Academic session</span><strong>Not configured</strong></div>
      <div class="info-card"><span>Current term</span><strong>Not configured</strong></div>
    </div>`;
}

function renderStudents() {
  const store = loadStore();
  const pending = store.admissions.filter((a) => a.status === "PENDING");

  page.innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Students</h2>
        <p class="muted">Admit students locally. Approval creates the student record.</p>
      </div>
      <button class="primary-button" id="new-admission">New admission</button>
    </div>

    <div id="student-form"></div>

    <h3>Students</h3>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Admission number</th><th>Class</th><th>Gender</th></tr></thead>
        <tbody id="student-rows"></tbody>
      </table>
    </div>

    <h3>Pending admissions</h3>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Admission number</th><th>Class</th><th>Action</th></tr></thead>
        <tbody id="admission-rows"></tbody>
      </table>
    </div>`;

  const studentRows = document.querySelector("#student-rows");
  studentRows.innerHTML = store.students.length
    ? store.students.map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.admissionNumber || "—")}</td><td>${escapeHtml(s.classId || "—")}</td><td>${escapeHtml(s.gender || "—")}</td></tr>`).join("")
    : '<tr><td colspan="4" class="empty">No students yet.</td></tr>';

  const admissionRows = document.querySelector("#admission-rows");
  admissionRows.innerHTML = pending.length
    ? pending.map((a) => `<tr><td>${escapeHtml(a.applicantName)}</td><td>${escapeHtml(a.admissionNumber || "—")}</td><td>${escapeHtml(a.intendedClassId || "—")}</td><td><button class="small-button" data-approve="${a.admissionId}">Approve</button></td></tr>`).join("")
    : '<tr><td colspan="4" class="empty">No pending admissions.</td></tr>';

  document.querySelector("#new-admission").addEventListener("click", () => {
    document.querySelector("#student-form").innerHTML = `
      <form class="form-card" id="admission-form">
        <div class="form-grid">
          <label>Full name<input name="name" required></label>
          <label>Admission number<input name="admissionNumber"></label>
          <label>Class<input name="classId"></label>
          <label>Gender<select name="gender"><option value="">Select</option><option value="M">M</option><option value="F">F</option></select></label>
        </div>
        <div class="form-actions"><button class="primary-button" type="submit">Save admission</button></div>
      </form>`;
    document.querySelector("#admission-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const admission = {
        admissionId: id("admission"),
        schoolId: "local-school",
        applicantName: String(data.get("name")).trim(),
        intendedClassId: String(data.get("classId")).trim() || undefined,
        admissionNumber: String(data.get("admissionNumber")).trim() || undefined,
        gender: String(data.get("gender")) || undefined,
        status: "PENDING",
        createdByUserId: "local-admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const next = loadStore();
      next.admissions.push(admission);
      saveStore(next);
      renderStudents();
    });
  });

  document.querySelectorAll("[data-approve]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = loadStore();
      const admission = next.admissions.find((a) => a.admissionId === button.dataset.approve);
      if (!admission) return;
      const now = new Date().toISOString();
      next.students.push({
        studentId: id("student"),
        schoolId: admission.schoolId,
        admissionId: admission.admissionId,
        name: admission.applicantName,
        classId: admission.intendedClassId,
        admissionNumber: admission.admissionNumber,
        gender: admission.gender,
        createdAt: now
      });
      admission.status = "APPROVED";
      admission.studentId = next.students.at(-1).studentId;
      admission.updatedAt = now;
      saveStore(next);
      renderStudents();
    });
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[char]));
}

function render(section) {
  const [heading, description] = labels[section];
  title.textContent = heading;
  if (section === "school") {
    renderSchool();
  } else if (section === "students") {
    renderStudents();
  } else {
    page.innerHTML = `
      <h2>${description}</h2>
      <p class="muted">This section is part of the Admin workspace shell. Its existing module will provide the records and actions.</p>`;
  }
}

nav.forEach((button) => {
  button.addEventListener("click", () => {
    nav.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    render(button.dataset.section);
  });
});

render("school");
