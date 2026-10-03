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

const SCHOOL_STORAGE_KEY = "skulgo.admin.school.v1";
const STUDENT_STORAGE_KEY = "skulgo.admin.admission-students.v1";
const memoryStorage = new Map();

function readStorage(key) {
  try { const value = localStorage.getItem(key); if (value !== null) return value; } catch (error) { console.warn("localStorage read unavailable", error); }
  try { const value = sessionStorage.getItem(key); if (value !== null) return value; } catch (error) { console.warn("sessionStorage read unavailable", error); }
  return memoryStorage.get(key) ?? null;
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, value); return; } catch (error) { console.warn("localStorage write unavailable", error); }
  try { sessionStorage.setItem(key, value); return; } catch (error) { console.warn("sessionStorage write unavailable", error); }
  memoryStorage.set(key, value);
}

function loadSchool() {
  try {
    return JSON.parse(readStorage(SCHOOL_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveSchool(school) {
  writeStorage(SCHOOL_STORAGE_KEY, JSON.stringify(school));
}

function loadStore() {
  try {
    return JSON.parse(readStorage(STUDENT_STORAGE_KEY) || '{"admissions":[],"students":[]}');
  } catch {
    return { admissions: [], students: [] };
  }
}

function saveStore(store) {
  writeStorage(STUDENT_STORAGE_KEY, JSON.stringify(store));
}

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[char]));
}

const nav = document.querySelectorAll(".nav-item");
const title = document.querySelector("#page-title");
const page = document.querySelector("#page");

function renderSchool() {
  const school = loadSchool();

  page.innerHTML = `
    <div class="section-heading">
      <div>
        <h2>School setup</h2>
        <p class="muted">Manage the school's identity and current academic period.</p>
      </div>
      <button class="primary-button" id="edit-school">${school ? "Edit setup" : "Set up school"}</button>
    </div>

    <div id="school-form"></div>

    <div class="info-grid">
      <div class="info-card"><span>School</span><strong>${escapeHtml(school?.name || "Not configured")}</strong></div>
      <div class="info-card"><span>Academic session</span><strong>${escapeHtml(school?.session?.name || "Not configured")}</strong></div>
      <div class="info-card"><span>Current term</span><strong>${escapeHtml(school?.term?.name || "Not configured")}</strong></div>
    </div>

    ${school ? `
      <div class="school-details">
        <h3>School details</h3>
        <dl class="details-grid">
          <div><dt>School type</dt><dd>${escapeHtml(school.schoolType || "—")}</dd></div>
          <div><dt>Phone</dt><dd>${escapeHtml(school.phone || "—")}</dd></div>
          <div><dt>Email</dt><dd>${escapeHtml(school.email || "—")}</dd></div>
          <div><dt>Address</dt><dd>${escapeHtml(school.address || "—")}</dd></div>
        </dl>
      </div>` : ""}`;

  document.querySelector("#edit-school").addEventListener("click", () => {
    const current = loadSchool();
    document.querySelector("#school-form").innerHTML = `
      <form class="form-card" id="school-setup-form">
        <div class="form-grid">
          <label>School name<input name="name" value="${escapeHtml(current?.name || "")}" required></label>
          <label>School type
            <select name="schoolType" required>
              <option value="">Select</option>
              <option value="Primary" ${current?.schoolType === "Primary" ? "selected" : ""}>Primary</option>
              <option value="Secondary" ${current?.schoolType === "Secondary" ? "selected" : ""}>Secondary</option>
              <option value="Primary and Secondary" ${current?.schoolType === "Primary and Secondary" ? "selected" : ""}>Primary and Secondary</option>
              <option value="Other" ${current?.schoolType === "Other" ? "selected" : ""}>Other</option>
            </select>
          </label>
          <label>Phone<input name="phone" value="${escapeHtml(current?.phone || "")}"></label>
          <label>Email<input name="email" type="email" value="${escapeHtml(current?.email || "")}"></label>
          <label>Address<input name="address" value="${escapeHtml(current?.address || "")}"></label>
          <label>Academic session<input name="session" placeholder="2026/2027" value="${escapeHtml(current?.session?.name || "")}" required></label>
          <label>Current term
            <select name="term" required>
              <option value="">Select</option>
              <option value="First Term" ${current?.term?.name === "First Term" ? "selected" : ""}>First Term</option>
              <option value="Second Term" ${current?.term?.name === "Second Term" ? "selected" : ""}>Second Term</option>
              <option value="Third Term" ${current?.term?.name === "Third Term" ? "selected" : ""}>Third Term</option>
            </select>
          </label>
        </div>
        <div class="form-actions">
          <button class="primary-button" type="submit">Save school setup</button>
        </div>
        <p class="form-message" id="school-save-message" role="status" aria-live="polite"></p>
      </form>`;

    document.querySelector("#school-setup-form").addEventListener("submit", (event) => {
      event.preventDefault();

      const form = event.currentTarget;
      const message = document.querySelector("#school-save-message");

      if (!form.reportValidity()) {
        message.textContent = "Please complete School name, School type, Academic session, and Current term.";
        return;
      }

      try {
        const data = new FormData(form);
        const now = new Date().toISOString();
        const existing = loadSchool();
        const schoolId = existing?.schoolId || id("school");
        const sessionId = existing?.session?.sessionId || id("session");
        const termId = existing?.term?.termId || id("term");

        saveSchool({
          schoolId,
          name: String(data.get("name") || "").trim(),
          schoolType: String(data.get("schoolType") || "").trim(),
          phone: String(data.get("phone") || "").trim() || undefined,
          email: String(data.get("email") || "").trim() || undefined,
          address: String(data.get("address") || "").trim() || undefined,
          createdAt: existing?.createdAt || now,
          session: {
            sessionId,
            schoolId,
            name: String(data.get("session") || "").trim(),
            createdAt: existing?.session?.createdAt || now,
            isCurrent: true
          },
          term: {
            termId,
            schoolId,
            sessionId,
            name: String(data.get("term") || "").trim(),
            createdAt: existing?.term?.createdAt || now,
            isCurrent: true
          }
        });

        renderSchool();
      } catch (error) {
        message.textContent = `Could not save school setup: ${error?.message || "storage error"}`;
        console.error(error);
      }
    });
  });
}

function renderStudents() {
  const school = loadSchool();

  if (!school) {
    page.innerHTML = `
      <h2>Students</h2>
      <p class="muted">Set up the school before creating student records.</p>
      <div class="notice-card">
        <strong>School setup required</strong>
        <p>Create the school's identity, academic session and current term first.</p>
        <button class="primary-button" id="go-school">Go to School setup</button>
      </div>`;
    document.querySelector("#go-school").addEventListener("click", () => {
      nav.forEach((item) => item.classList.toggle("active", item.dataset.section === "school"));
      render("school");
    });
    return;
  }

  const store = loadStore();
  const pending = store.admissions.filter((a) => a.status === "PENDING" && a.schoolId === school.schoolId);
  const students = store.students.filter((s) => s.schoolId === school.schoolId);

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

  document.querySelector("#student-rows").innerHTML = students.length
    ? students.map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.admissionNumber || "—")}</td><td>${escapeHtml(s.classId || "—")}</td><td>${escapeHtml(s.gender || "—")}</td></tr>`).join("")
    : '<tr><td colspan="4" class="empty">No students yet.</td></tr>';

  document.querySelector("#admission-rows").innerHTML = pending.length
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
        schoolId: school.schoolId,
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
      const admission = next.admissions.find((a) => a.admissionId === button.dataset.approve && a.schoolId === school.schoolId);
      if (!admission) return;
      const now = new Date().toISOString();
      const studentId = id("student");
      next.students.push({
        studentId,
        schoolId: admission.schoolId,
        admissionId: admission.admissionId,
        name: admission.applicantName,
        classId: admission.intendedClassId,
        admissionNumber: admission.admissionNumber,
        gender: admission.gender,
        createdAt: now
      });
      admission.status = "APPROVED";
      admission.studentId = studentId;
      admission.updatedAt = now;
      saveStore(next);
      renderStudents();
    });
  });
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
