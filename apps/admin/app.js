const labels = {
  school: ["School", "School setup"],
  students: ["Students", "Students"],
  classes: ["Classes", "Classes"],
  subjects: ["Subjects", "Subjects"],
  teachers: ["Teachers", "Teachers"],
  assignments: ["Teaching Assignments", "Teaching Assignments"],
  attendance: ["Attendance", "Attendance"],
  results: ["Results", "Results"],
  "report-card": ["Report Card", "Report Card"],
  "grade-band": ["Grade Band", "Grade Band"],
  settings: ["Settings", "Settings"],
  fees: ["Fees", "Fees"],
  cashier: ["Cashier", "Cashier"],
  messaging: ["Messaging", "Messaging"],
};

const SCHOOL_STORAGE_KEY = "skulgo.admin.school.v1";
const SCHOOL_API_PATH = "/api/school";
const STUDENT_STORAGE_KEY = "skulgo.admin.admission-students.v1";
const STUDENT_API_PATH = "/api/students";
const CLASS_STORAGE_KEY = "skulgo.admin.classes.v1";
const SUBJECT_STORAGE_KEY = "skulgo.admin.subjects.v1";
const TEACHER_STORAGE_KEY = "skulgo.admin.teachers.v1";
const ASSIGNMENT_STORAGE_KEY = "skulgo.admin.assignments.v1";
const memoryStorage = new Map();
let studentStoreCache = null;
let classStoreCache = null;
let subjectStoreCache = null;
let teacherStoreCache = null;
let assignmentStoreCache = null;

function readStorage(key) {
  try {
    const value = localStorage.getItem(key);
    if (value !== null) return value;
  } catch (error) {
    console.warn("localStorage read unavailable", error);
  }
  try {
    const value = sessionStorage.getItem(key);
    if (value !== null) return value;
  } catch (error) {
    console.warn("sessionStorage read unavailable", error);
  }
  return memoryStorage.get(key) ?? null;
}

function writeStorage(key, value) {
  let saved = false;
  try {
    localStorage.setItem(key, value);
    saved = localStorage.getItem(key) === value;
  } catch (error) {
    console.warn("localStorage write unavailable", error);
  }

  try {
    sessionStorage.setItem(key, value);
    if (sessionStorage.getItem(key) === value) saved = true;
  } catch (error) {
    console.warn("sessionStorage write unavailable", error);
  }

  if (!saved) {
    memoryStorage.set(key, value);
  }

  return saved;
}

function loadSchool() {
  try {
    return JSON.parse(readStorage(SCHOOL_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveSchool(school) {
  // School records belong to this device/browser and must not depend on a server.
  writeStorage(SCHOOL_STORAGE_KEY, JSON.stringify(school));
  return Promise.resolve(school);
}

async function hydrateSchoolStore() {
  // SkulGo App is local-first. GitHub Pages has no required school API,
  // so the Admin screen must render immediately from device storage.
  const local = loadSchool();
  if (local && typeof local === "object" && local.schoolId && local.name) {
    return true;
  }
  return false;
}

function loadStore() {
  if (studentStoreCache) return studentStoreCache;
  try {
    const parsed = JSON.parse(readStorage(STUDENT_STORAGE_KEY) || '{"admissions":[],"students":[]}');
    studentStoreCache = {
      admissions: Array.isArray(parsed.admissions) ? parsed.admissions : [],
      students: Array.isArray(parsed.students) ? parsed.students : []
    };
  } catch {
    studentStoreCache = { admissions: [], students: [] };
  }
  return studentStoreCache;
}

function saveStore(store) {
  studentStoreCache = {
    admissions: Array.isArray(store.admissions) ? store.admissions : [],
    students: Array.isArray(store.students) ? store.students : []
  };

  const serialized = JSON.stringify(studentStoreCache);
  writeStorage(STUDENT_STORAGE_KEY, serialized);

  return fetch(STUDENT_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: serialized,
    cache: "no-store"
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error("Local student store rejected the save.");
    }
    const saved = await response.json();
    studentStoreCache = {
      admissions: Array.isArray(saved.admissions) ? saved.admissions : [],
      students: Array.isArray(saved.students) ? saved.students : []
    };
    writeStorage(STUDENT_STORAGE_KEY, JSON.stringify(studentStoreCache));
    return studentStoreCache;
  }).catch((error) => {
    console.warn("Local student store save failed; browser storage remains available.", error);
    return studentStoreCache;
  });
}

async function hydrateStudentStore() {
  try {
    const response = await fetch(STUDENT_API_PATH, { cache: "no-store" });
    if (!response.ok) return false;
    const saved = await response.json();
    const serverStore = {
      admissions: Array.isArray(saved.admissions) ? saved.admissions : [],
      students: Array.isArray(saved.students) ? saved.students : []
    };
    const local = loadStore();
    if (serverStore.admissions.length || serverStore.students.length || (!local.admissions.length && !local.students.length)) {
      studentStoreCache = serverStore;
      writeStorage(STUDENT_STORAGE_KEY, JSON.stringify(studentStoreCache));
    }
    return true;
  } catch (error) {
    console.warn("Local student store unavailable; using browser storage.", error);
    return false;
  }
}

function loadClasses() {
  if (classStoreCache) return classStoreCache;
  try {
    const parsed = JSON.parse(readStorage(CLASS_STORAGE_KEY) || "[]");
    classStoreCache = Array.isArray(parsed) ? parsed : [];
  } catch {
    classStoreCache = [];
  }
  return classStoreCache;
}

function saveClasses(classes) {
  classStoreCache = Array.isArray(classes) ? classes : [];
  writeStorage(CLASS_STORAGE_KEY, JSON.stringify(classStoreCache));
}

function loadSubjects() {
  if (subjectStoreCache) return subjectStoreCache;
  try {
    const parsed = JSON.parse(readStorage(SUBJECT_STORAGE_KEY) || "[]");
    subjectStoreCache = Array.isArray(parsed) ? parsed : [];
  } catch {
    subjectStoreCache = [];
  }
  return subjectStoreCache;
}

function saveSubjects(subjects) {
  subjectStoreCache = Array.isArray(subjects) ? subjects : [];
  writeStorage(SUBJECT_STORAGE_KEY, JSON.stringify(subjectStoreCache));
}

function loadTeachers() {
  if (teacherStoreCache) return teacherStoreCache;
  try {
    const parsed = JSON.parse(readStorage(TEACHER_STORAGE_KEY) || "[]");
    teacherStoreCache = Array.isArray(parsed) ? parsed : [];

    const usedIds = new Set();
    let changed = false;

    for (const teacher of teacherStoreCache) {
      const teacherId = String(teacher.teacherId || "");
      if (!teacherId || !usedIds.has(teacherId)) {
        if (teacherId) usedIds.add(teacherId);
        continue;
      }

      const year = String(loadSchool()?.session?.name || new Date().getFullYear()).split("/")[0];
      const usedNumbers = teacherStoreCache
        .filter((item) => item.schoolId === teacher.schoolId)
        .map((item) => String(item.teacherId || "").match(/(\\d{4})$/)?.[1])
        .filter(Boolean)
        .map(Number);
      let nextNumber = Math.max(0, ...usedNumbers, 8764) + 1;

      let repairedId = `AC/AC/${year}/${String(nextNumber).padStart(4, "0")}`;
      while (usedIds.has(repairedId)) {
        nextNumber += 1;
        repairedId = `AC/AC/${year}/${String(nextNumber).padStart(4, "0")}`;
      }

      teacher.teacherId = repairedId;
      usedIds.add(repairedId);
      changed = true;
    }

    if (changed) {
      writeStorage(TEACHER_STORAGE_KEY, JSON.stringify(teacherStoreCache));
    }
  } catch {
    teacherStoreCache = [];
  }
  return teacherStoreCache;
}

function saveTeachers(teachers) {
  teacherStoreCache = Array.isArray(teachers) ? teachers : [];
  writeStorage(TEACHER_STORAGE_KEY, JSON.stringify(teacherStoreCache));
}

function loadAssignments() {
  if (assignmentStoreCache) return assignmentStoreCache;
  try {
    const parsed = JSON.parse(readStorage(ASSIGNMENT_STORAGE_KEY) || "[]");
    assignmentStoreCache = Array.isArray(parsed) ? parsed : [];
  } catch {
    assignmentStoreCache = [];
  }
  return assignmentStoreCache;
}

function saveAssignments(assignments) {
  assignmentStoreCache = Array.isArray(assignments) ? assignments : [];
  writeStorage(ASSIGNMENT_STORAGE_KEY, JSON.stringify(assignmentStoreCache));
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

async function renderSchool() {
  await hydrateSchoolStore();
  const school = loadSchool();

  page.innerHTML = `
    <div class="section-heading">
      <div>
        <h2>School setup</h2>
        <p class="muted"></p>
      </div>
      <button class="primary-button" id="edit-school" type="button" hidden>${school ? "Edit setup" : "Set up school"}</button>
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
          <div><dt>School sections</dt><dd>${escapeHtml((school.schoolSections || (school.schoolType === "Primary and Secondary" ? ["Primary", "Secondary"] : school.schoolType ? [school.schoolType] : [])).join(", ") || "â")}</dd></div>
          <div><dt>Phone</dt><dd>${escapeHtml(school.phone || "â")}</dd></div>
          <div><dt>Email</dt><dd>${escapeHtml(school.email || "â")}</dd></div>
          <div><dt>Address</dt><dd>${escapeHtml(school.address || "â")}</dd></div>
        </dl>
      </div>` : ""}`;

  document.querySelector("#edit-school").addEventListener("click", () => {
    const current = loadSchool();
    document.querySelector("#school-form").innerHTML = `
      <form class="form-card" id="school-setup-form">
        <div class="form-grid">
          <label>School name<input name="name" value="${escapeHtml(current?.name || "")}" required></label>
          <div class="section-picker">
            <label>School sections
              <select id="school-section-select">
                <option value="">Select section</option>
                <option value="Nursery">Nursery</option>
                <option value="Primary">Primary</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Custom">Custom</option>
              </select>
            </label>
            <div class="section-add-row">
              <button type="button" class="small-button" id="add-school-section">Add section</button>
            </div>
            <div id="selected-school-sections" class="selected-sections"></div>
            <input type="hidden" name="schoolSections" id="school-sections-value">
            <small class="field-help">Add one or more sections.</small>
          </div>
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
        <p class="muted" id="assignment-duty-help">Class Master: responsible for attendance and class-level duties.</p>

        <div class="form-actions">
          <button class="primary-button" type="submit">Save school setup</button>
        </div>
        <p class="form-message" id="school-save-message" role="status" aria-live="polite"></p>
      </form>`;

    const sectionSelect = document.querySelector("#school-section-select");
    const addSectionButton = document.querySelector("#add-school-section");
    const selectedSectionsEl = document.querySelector("#selected-school-sections");
    const sectionsValue = document.querySelector("#school-sections-value");
    const initialSections = current?.schoolSections
      || (current?.schoolType === "Primary and Secondary" ? ["Primary", "Secondary"] : current?.schoolType ? [current.schoolType] : []);
    let selectedSections = [...initialSections];

    function renderSelectedSections() {
      sectionsValue.value = JSON.stringify(selectedSections);
      selectedSectionsEl.innerHTML = selectedSections.length
        ? selectedSections.map((section) => `<span class="selected-section">${escapeHtml(section)} <button type="button" class="remove-section" data-remove-section="${escapeHtml(section)}" aria-label="Remove ${escapeHtml(section)}">Ã</button></span>`).join("")
        : '<span class="field-help">No sections selected.</span>';
      selectedSectionsEl.querySelectorAll("[data-remove-section]").forEach((button) => {
        button.addEventListener("click", () => {
          selectedSections = selectedSections.filter((section) => section !== button.dataset.removeSection);
          renderSelectedSections();
        });
      });
    }

    addSectionButton.addEventListener("click", () => {
      let section = sectionSelect.value;
      if (!section) return;
      if (section === "Custom") {
        const custom = window.prompt("Enter custom school section");
        section = String(custom || "").trim();
        if (!section) return;
      }
      if (!selectedSections.includes(section)) selectedSections.push(section);
      sectionSelect.value = "";
      renderSelectedSections();
    });

    renderSelectedSections();

    document.querySelector("#school-setup-form").addEventListener("submit", async (event) => {
      event.preventDefault();

      const form = event.currentTarget;
      const message = document.querySelector("#school-save-message");

      if (!form.reportValidity()) {
        message.textContent = "Please complete School name, School section, Academic session, and Current term.";
        return;
      }

      try {
        const data = new FormData(form);
        const schoolSections = JSON.parse(String(data.get("schoolSections") || "[]"));
        if (!schoolSections.length) {
          message.textContent = "Select at least one school section.";
          return;
        }
        const now = new Date().toISOString();
        const existing = loadSchool();
        const schoolId = existing?.schoolId || id("school");
        const existingSections = Array.isArray(existing?.sections) ? existing.sections : [];
        const sections = schoolSections.map((name) => {
          const existingSection = existingSections.find((section) => section.name === name);
          return existingSection || {
            sectionId: id("section"),
            schoolId,
            name,
            type: ["Nursery", "Primary", "Junior", "Senior"].includes(name) ? name : "Custom",
            createdAt: now
          };
        });
        const schoolType = schoolSections.length === 1 ? schoolSections[0] : "Multiple Sections";
        const sessionId = existing?.session?.sessionId || id("session");
        const termId = existing?.term?.termId || id("term");

        await saveSchool({
          schoolId,
          name: String(data.get("name") || "").trim(),
          schoolType,
          schoolSections: sections.map((section) => section.name),
          sections,
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

        await renderSchool();
      } catch (error) {
        message.textContent = `Could not save school setup: ${error?.message || "storage error"}`;
        console.error(error);
      }
    });

  });

  const current = loadSchool();
  if (!current?.session?.name || !current?.term?.name || !current?.schoolSections?.length) {
    document.querySelector("#edit-school").click();
  }
}

function renderClasses() {
  const school = loadSchool();
  if (!school) {
    page.innerHTML = '<h2>Classes</h2><p class="muted">Set up the school before creating classes.</p>';
    return;
  }

  const sections = Array.isArray(school.sections) && school.sections.length
    ? school.sections
    : (school.schoolSections || (school.schoolType === "Primary and Secondary" ? ["Primary", "Secondary"] : school.schoolType ? [school.schoolType] : [])).map((name) => ({
        sectionId: `section-${String(name).toLowerCase().replace(/\\s+/g, "-")}`,
        name
      }));
  const classes = loadClasses().filter((item) => item.schoolId === school.schoolId);

  page.innerHTML = `
    <div class="section-heading">
      <div><h2>Classes</h2><p class="muted">Create classes under the school's selected sections.</p></div>
      <button class="primary-button" id="new-class">New class</button>
    </div>
    <div id="class-form"></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Class</th><th>Section</th></tr></thead>
        <tbody id="class-rows"></tbody>
      </table>
    </div>`;

  document.querySelector("#class-rows").innerHTML = classes.length
    ? classes.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.sectionName)}</td></tr>`).join("")
    : '<tr><td colspan="2" class="empty">No classes yet.</td></tr>';

  document.querySelector("#new-class").addEventListener("click", () => {
    document.querySelector("#class-form").innerHTML = `
      <form class="form-card" id="class-create-form">
        <div class="form-grid">
          <label>Section
            <select name="sectionId" required>
              <option value="">Select section</option>
              ${sections.map((section) => `<option value="${escapeHtml(section.sectionId)}">${escapeHtml(section.name)}</option>`).join("")}
            </select>
          </label>
          <label>Class name<input name="name" placeholder="Primary 1, JSS 1, SS 1" required></label>
        </div>
        <div class="form-actions"><button class="primary-button" type="submit">Save class</button></div>
      </form>`;

    document.querySelector("#class-create-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const sectionId = String(data.get("sectionId") || "").trim();
      const name = String(data.get("name") || "").trim();
      const section = sections.find((item) => item.sectionId === sectionId);
      if (!sectionId || !section || !name) return;
      const next = loadClasses();
      next.push({
        classId: id("class"),
        schoolId: school.schoolId,
        sectionId,
        sectionName: section.name,
        name,
        createdAt: new Date().toISOString()
      });
      saveClasses(next);
      renderClasses();
    });
  });
}

function renderSubjects() {
  if (typeof window.renderAdminSubjects === "function") return window.renderAdminSubjects();
  page.innerHTML = '<h2>Subjects</h2><p class="muted">Loading Subjects...</p>';
}

function renderTeachers() {
  const school = loadSchool();
  if (!school) {
    page.innerHTML = '<h2>Teachers</h2><p class="muted">Set up the school before creating teachers.</p>';
    return;
  }
  const teachers = loadTeachers().filter((item) => item.schoolId === school.schoolId);
  page.innerHTML = `
    <div class="section-heading">
      <div><h2>Teachers</h2><p class="muted">Manage the teachers working at this school.</p></div>
      <button class="primary-button" id="new-teacher">New teacher</button>
    </div>
    <div id="teacher-form"></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Teacher ID</th><th>Teacher</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="teacher-rows"></tbody>
      </table>
    </div>`;
  document.querySelector("#teacher-rows").innerHTML = teachers.length
    ? teachers.map((teacher) => `<tr><td>${escapeHtml(teacher.teacherId)}</td><td>${escapeHtml(teacher.name)}</td><td>${teacher.status === "ACTIVE" ? "Active" : "Disabled"}</td><td>${teacher.status === "ACTIVE" ? `<button class="small-button" data-disable-teacher="${escapeHtml(teacher.teacherId)}">Disable</button>` : "â"}</td></tr>`).join("")
    : '<tr><td colspan="4" class="empty">No teachers yet.</td></tr>';
  document.querySelector("#new-teacher").addEventListener("click", () => {
    document.querySelector("#teacher-form").innerHTML = `
      <form class="form-card" id="teacher-create-form">
        <div class="form-grid">
          <label>Teacher name<input name="name" placeholder="Teacher full name" required></label>
        </div>
        <div class="form-actions"><button class="primary-button" type="submit">Save teacher</button></div>
      </form>`;
    document.querySelector("#teacher-create-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = String(new FormData(event.currentTarget).get("name") || "").trim();
      if (!name) return;
      const next = loadTeachers();
      const year = String(school.session?.name || new Date().getFullYear()).split("/")[0];
      const usedIds = new Set(
        next
          .filter((item) => item.schoolId === school.schoolId)
          .map((item) => String(item.teacherId || ""))
      );
      let teacherId;
      do {
        const randomNumber = Math.floor(1000 + Math.random() * 9000);
        teacherId = `AC/AC/${year}/${String(randomNumber).padStart(4, "0")}`;
      } while (usedIds.has(teacherId));
      next.push({
        teacherId,
        schoolId: school.schoolId,
        name,
        status: "ACTIVE",
        createdAt: new Date().toISOString()
      });
      saveTeachers(next);
      renderTeachers();
    });
  });
  document.querySelectorAll("[data-disable-teacher]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = loadTeachers();
      const teacher = next.find((item) => item.teacherId === button.dataset.disableTeacher && item.schoolId === school.schoolId);
      if (!teacher) return;
      teacher.status = "DISABLED";
      saveTeachers(next);
      renderTeachers();
    });
  });
}

function renderStudents() {
  hydrateStudentStore().then(() => {
    if (document.querySelector("#page-title")?.textContent === "Students") {
      renderStudentsFromStore();
    }
  });
  renderStudentsFromStore();
}

function renderStudentsFromStore() {
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
  const students = store.students.filter((s) => s.schoolId === school.schoolId);

  page.innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Students</h2>
        <p class="muted">Manage student records and admissions on this device.</p>
      </div>
      <button class="primary-button" id="new-admission">New Admission</button>
    </div>

    <div id="student-form"></div>

    <h3>Pending Admissions</h3>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Admission ID</th><th>Class</th><th>Gender</th><th>Action</th></tr></thead>
        <tbody id="pending-admission-rows"></tbody>
      </table>
    </div>

    <h3>Student Records</h3>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Admission ID</th><th>Class</th><th>Gender</th></tr></thead>
        <tbody id="student-rows"></tbody>
      </table>
    </div>

  `;

  const className = (classId) => {
    const item = loadClasses().find((entry) => entry.schoolId === school.schoolId && entry.classId === classId);
    return item ? item.name : classId;
  };

  const pendingAdmissions = store.admissions.filter(
    (admission) => admission.schoolId === school.schoolId && admission.status === "PENDING"
  );

  document.querySelector("#pending-admission-rows").innerHTML = pendingAdmissions.length
    ? pendingAdmissions.map((admission) => `<tr><td>${escapeHtml(admission.applicantName)}</td><td>${escapeHtml(admission.admissionNumber || "—")}</td><td>${escapeHtml(className(admission.intendedClassId) || "—")}</td><td>${escapeHtml(admission.gender || "—")}</td><td><button type="button" class="small-button" data-approve="${escapeHtml(admission.admissionId)}">Approve Student</button></td></tr>`).join("")
    : '<tr><td colspan="5" class="empty">No pending admissions.</td></tr>';

  document.querySelector("#student-rows").innerHTML = students.length
    ? students.map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.admissionNumber || "—")}</td><td>${escapeHtml(className(s.classId) || "—")}</td><td>${escapeHtml(s.gender || "—")}</td></tr>`).join("")
    : '<tr><td colspan="4" class="empty">No students yet.</td></tr>';


  document.querySelector("#new-admission").addEventListener("click", () => {
    document.querySelector("#student-form").innerHTML = `
      <form class="form-card" id="admission-form">
        <div class="form-grid">
          <label>Full name<input name="name" required></label>
          <label>Admission ID<input name="admissionNumber" readonly placeholder="Generated automatically"></label>
          <label>Class
            <select name="classId" required>
              <option value="">Select class</option>
              ${loadClasses().filter((item) => item.schoolId === school.schoolId).map((item) => `<option value="${escapeHtml(item.classId)}">${escapeHtml(item.name)} â ${escapeHtml(item.sectionName)}</option>`).join("")}
            </select>
          </label>
          <label>Gender<select name="gender"><option value="">Select</option><option value="M">M</option><option value="F">F</option></select></label>
        </div>
        <div class="form-actions"><button class="primary-button" type="submit">Save Admission</button></div>
      </form>`;
    document.querySelector("#admission-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const next = loadStore();
      const schoolAdmissions = next.admissions.filter((a) => a.schoolId === school.schoolId);
      const classId = String(data.get("classId") || "").trim();
      const selectedClass = loadClasses().find((item) => item.schoolId === school.schoolId && item.classId === classId);
      if (!selectedClass) return;
      const sectionName = String(selectedClass.sectionName || "").trim().toUpperCase();
      const sectionCodes = {
        NURSERY: "NUR",
        PRIMARY: "PRI",
        JUNIOR: "JSS",
        SENIOR: "SS"
      };
      const section = sectionCodes[sectionName] || sectionName.replace(/\\s+/g, "-");
      const academicYear = String(school.session?.name || new Date().getFullYear()).split("/")[0];
      const usedAdmissionNumbers = new Set(
        schoolAdmissions
          .map((item) => String(item.admissionNumber || ""))
          .filter(Boolean)
      );
      let admissionNumber;
      do {
        const randomNumber = Math.floor(1000 + Math.random() * 9000);
        admissionNumber = `${school.admissionPrefix || "AC"}/${section}/${academicYear}/${String(randomNumber).padStart(4, "0")}`;
      } while (usedAdmissionNumbers.has(admissionNumber));
      const admission = {
        admissionId: id("admission"),
        schoolId: school.schoolId,
        applicantName: String(data.get("name")).trim(),
        intendedClassId: selectedClass.classId,
        admissionNumber,
        gender: String(data.get("gender")) || undefined,
        status: "PENDING",
        createdByUserId: "local-admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      next.admissions.push(admission);
      await saveStore(next);

      const savedAdmission = loadStore().admissions.find((item) => item.admissionId === admission.admissionId);
      if (!savedAdmission) {
        throw new Error("Admission was not retained after save.");
      }

      renderStudents();
    });
  });

  document.querySelectorAll("[data-approve]").forEach((button) => {
    button.addEventListener("click", async () => {
      const next = loadStore();
      const admission = next.admissions.find(
        (a) => a.admissionId === button.dataset.approve && a.schoolId === school.schoolId
      );
      if (!admission || admission.status !== "PENDING") return;
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
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now
      });
      admission.status = "APPROVED";
      admission.studentId = studentId;
      admission.updatedAt = now;
      await saveStore(next);
      renderStudents();
    });
  });
}

const ATTENDANCE_STORAGE_KEY = "skulgo.admin.attendance.v1";

function loadAttendance() {
  try {
    const parsed = JSON.parse(readStorage(ATTENDANCE_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAttendance(records) {
  writeStorage(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
}

function renderAssignments() {
  const school = loadSchool();

  if (!school?.schoolId) {
    page.innerHTML = `
      <h2>Teaching Assignments</h2>
      <p class="muted">Set up the school before creating teaching assignments.</p>
    `;
    return;
  }

  const teachers = loadTeachers().filter(
    (item) => item.schoolId === school.schoolId && item.status === "ACTIVE"
  );

  const classes = loadClasses().filter(
    (item) => item.schoolId === school.schoolId
  );

  const subjects = loadSubjects().filter(
    (item) => item.schoolId === school.schoolId && item.status === "ACTIVE"
  );

  const assignments = loadAssignments().filter(
    (item) => item.schoolId === school.schoolId
  );

  const teacherName = (teacherId) =>
    teachers.find((item) => item.teacherId === teacherId)?.name || teacherId;

  const className = (classId) =>
    classes.find((item) => item.classId === classId)?.name || classId;

  const subjectName = (subjectId) =>
    subjects.find((item) => item.subjectId === subjectId)?.name || subjectId;

  page.innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Teaching Assignments</h2>
        <p class="muted">Assign teachers to classes and subjects.</p>
      </div>
      <button type="button" class="primary-button" id="new-assignment">New assignment</button>
    </div>

    <div id="assignment-form"></div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Teacher</th>
            <th>Class</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="assignment-rows"></tbody>
      </table>
    </div>
  `;

  const rows = assignments;

  document.querySelector("#assignment-rows").innerHTML = rows.length
    ? rows.map((assignment) => `
        <tr>
          <td>${escapeHtml(assignment.assignmentType === "CLASS_MASTER" ? "Class Master" : "Subject Teacher")}</td>
          <td>${escapeHtml(teacherName(assignment.teacherId))}</td>
          <td>${escapeHtml(className(assignment.classId))}</td>
          <td>${escapeHtml(assignment.assignmentType === "CLASS_MASTER" ? "—" : subjectName(assignment.subjectId))}</td>
          <td>${assignment.status === "ACTIVE" ? "Active" : "Disabled"}</td>
          <td>
            ${
              assignment.status === "ACTIVE"
                ? `<button class="small-button" data-disable-assignment="${escapeHtml(assignment.assignmentId)}">Disable</button>`
                : ""
            }
          </td>
        </tr>
      `).join("")
    : '<tr><td colspan="6" class="empty">No teaching assignments yet.</td></tr>';

  document.querySelector("#new-assignment").addEventListener("click", () => {
    document.querySelector("#assignment-form").innerHTML = `
      <form class="form-card" id="assignment-create-form">
        <div class="form-grid">
          <label>
            Assignment type
            <select name="assignmentType" id="assignment-type" required>
              <option value="CLASS_MASTER">Class Master</option>
              <option value="SUBJECT_TEACHER">Subject Teacher</option>
            </select>
          </label>

          <label>
            Teacher
            <select name="teacherId" required>
              <option value="">Select teacher</option>
              ${teachers.map((teacher) => `
                <option value="${escapeHtml(teacher.teacherId)}">
                  ${escapeHtml(teacher.name)}
                </option>
              `).join("")}
            </select>
          </label>

          <label>
            Class
            <select name="classId" required>
              <option value="">Select class</option>
              ${classes.map((item) => `
                <option value="${escapeHtml(item.classId)}">
                  ${escapeHtml(item.name)}
                </option>
              `).join("")}
            </select>
          </label>

          <label id="assignment-subject-field">
            Subject
            <select name="subjectId" id="assignment-subject">
              <option value="">Select subject</option>
              ${subjects.map((subject) => `
                <option value="${escapeHtml(subject.subjectId)}">
                  ${escapeHtml(subject.name)}
                </option>
              `).join("")}
            </select>
          </label>
        </div>

        <p class="muted" id="assignment-duty-help">
          Class Master: responsible for attendance and class-level duties.
        </p>

        <div class="form-actions">
          <button class="primary-button" type="submit">Save assignment</button>
        </div>

        <p class="form-message" id="assignment-message" role="status" aria-live="polite"></p>
      </form>
    `;

    const form = document.querySelector("#assignment-create-form");
    const typeSelect = document.querySelector("#assignment-type");
    const subjectField = document.querySelector("#assignment-subject-field");
    const subjectSelect = document.querySelector("#assignment-subject");
    const dutyHelp = document.querySelector("#assignment-duty-help");

    const updateAssignmentType = () => {
      const isClassMaster = typeSelect.value === "CLASS_MASTER";
      subjectField.style.display = isClassMaster ? "none" : "";
      subjectSelect.required = !isClassMaster;
      if (isClassMaster) subjectSelect.value = "";
      dutyHelp.textContent = isClassMaster
        ? "Class Master: responsible for attendance and class-level duties."
        : "Subject Teacher: responsible for CA, exams, and subject results.";
    };

    typeSelect.addEventListener("change", updateAssignmentType);
    updateAssignmentType();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const data = new FormData(form);
      const assignmentType = String(data.get("assignmentType") || "").trim();
      const teacherId = String(data.get("teacherId") || "").trim();
      const classId = String(data.get("classId") || "").trim();
      const subjectId = String(data.get("subjectId") || "").trim();

      const teacher = teachers.find((item) => item.teacherId === teacherId);
      const selectedClass = classes.find((item) => item.classId === classId);
      const subject = assignmentType === "SUBJECT_TEACHER"
        ? subjects.find((item) => item.subjectId === subjectId)
        : null;

      if (!teacher || !selectedClass) {
        document.querySelector("#assignment-message").textContent =
          "Select a valid teacher and class.";
        return;
      }

      if (assignmentType === "SUBJECT_TEACHER" && !subject) {
        document.querySelector("#assignment-message").textContent =
          "Select a valid subject for the Subject Teacher assignment.";
        return;
      }

      const next = loadAssignments();

      const duplicate = next.find(
        (item) =>
          item.schoolId === school.schoolId &&
          item.assignmentType === assignmentType &&
          item.classId === classId &&
          (assignmentType === "CLASS_MASTER" || item.subjectId === subjectId) &&
          item.status === "ACTIVE"
      );

      if (duplicate) {
        document.querySelector("#assignment-message").textContent =
          assignmentType === "CLASS_MASTER"
            ? "This class already has an active Class Master."
            : "This class and subject already has an active Subject Teacher assignment.";
        return;
      }

      next.push({
        assignmentId: id("assignment"),
        schoolId: school.schoolId,
        teacherId,
        classId,
        assignmentType,
        ...(assignmentType === "SUBJECT_TEACHER" ? { subjectId } : {}),
        status: "ACTIVE",
        createdAt: new Date().toISOString()
      });

      saveAssignments(next);
      nav.forEach((item) => item.classList.toggle("active", item.dataset.section === "assignments"));
      render("assignments");
    });
  });

  document.querySelectorAll("[data-disable-assignment]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = loadAssignments();

      const assignment = next.find(
        (item) =>
          item.assignmentId === button.dataset.disableAssignment &&
          item.schoolId === school.schoolId
      );

      if (!assignment) return;

      assignment.status = "DISABLED";
      saveAssignments(next);
      renderAssignments();
    });
  });
}
function renderAttendance() {
  const school = loadSchool();
  if (!school?.schoolId || !school?.session?.name || !school?.term?.name) {
    page.innerHTML = '<h2>Attendance</h2><p class="muted">Complete School Setup before recording attendance.</p>';
    return;
  }

  const classes = loadClasses().filter((item) => item.schoolId === school.schoolId);
  const today = new Date().toISOString().slice(0, 10);

  page.innerHTML = `
    <div class="section-heading">
      <div><h2>Attendance</h2><p class="muted">Record and review student attendance by class.</p></div>
    </div>
    <form class="form-card" id="attendance-selector">
      <div class="form-grid">
        <label>Class<select name="classId" required><option value="">Select class</option>${classes.map((item) => `<option value="${escapeHtml(item.classId)}">${escapeHtml(item.name)}</option>`).join("")}</select></label>
        <label>Date<input type="date" name="date" value="${today}" required></label>
      </div>
      <div class="form-actions"><button class="primary-button" type="submit">Load students</button></div>
    </form>
    <div id="attendance-record-form"></div>
    <div class="card">
      <h3>Attendance totals</h3>
      <div class="form-grid">
        <label>Period<select id="attendance-period"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="termly">Termly</option><option value="yearly">Yearly</option></select></label>
        <div></div>
      </div>
      <div id="attendance-summary"></div>
    </div>
  `;

  const selector = document.querySelector("#attendance-selector");
  selector.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(selector);
    renderAttendanceList(school, String(data.get("classId") || ""), String(data.get("date") || today));
  });

  document.querySelector("#attendance-period").addEventListener("change", () => renderAttendanceSummary(school, String(selector.querySelector("[name=classId]").value || ""), String(selector.querySelector("[name=date]").value || today)));
  renderAttendanceSummary(school, "", today);
}

function attendancePeriodDates(date, period) {
  const d = new Date(date + "T00:00:00");
  const start = new Date(d), end = new Date(d);
  if (period === "daily") return [date, date];
  if (period === "weekly") {
    const day = d.getDay();
    start.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
  }
  if (period === "monthly") {
    start.setDate(1);
    end.setMonth(d.getMonth() + 1, 0);
  }
  if (period === "yearly") {
    start.setMonth(0, 1);
    end.setMonth(11, 31);
  }
  if (period === "termly") {
    start.setMonth(0, 1);
    end.setMonth(11, 31);
  }
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

function renderAttendanceSummary(school, classId, date) {
  const box = document.querySelector("#attendance-summary");
  if (!box) return;
  const period = document.querySelector("#attendance-period")?.value || "daily";
  const [from, to] = attendancePeriodDates(date, period);
  const termName = school.term?.name || "";
  const students = loadStore().students.filter((student) => student.schoolId === school.schoolId && (!classId || student.classId === classId));
  const records = loadAttendance().filter((record) =>
    record.schoolId === school.schoolId &&
    (!classId || record.classId === classId) &&
    record.date >= from &&
    record.date <= to &&
    (period !== "termly" || !record.termId || String(record.termId) === String(termName) || String(record.termId) === String(school.term?.termId || ""))
  );
  const unique = new Map();
  records.forEach((record) => unique.set(record.date + "|" + record.studentId, record));
  const values = [...unique.values()];
  const present = values.filter((record) => String(record.status).toLowerCase() === "present").length;
  const absent = values.filter((record) => String(record.status).toLowerCase() === "absent").length;
  const maleIds = new Set(students.filter((student) => String(student.gender || "").toUpperCase().startsWith("M")).map((student) => student.studentId));
  const femaleIds = new Set(students.filter((student) => String(student.gender || "").toUpperCase().startsWith("F")).map((student) => student.studentId));
  const m = new Set(values.filter((record) => maleIds.has(record.studentId)).map((record) => record.studentId)).size;
  const f = new Set(values.filter((record) => femaleIds.has(record.studentId)).map((record) => record.studentId)).size;
  const rate = values.length ? Math.round((present / values.length) * 100) : 0;

  box.innerHTML = `
    <div class="attendance-summary-grid">
      <div><span>Total</span><strong>${values.length}</strong></div>
      <div><span>M</span><strong>${m}</strong></div>
      <div><span>F</span><strong>${f}</strong></div>
      <div><span>Present</span><strong>${present}</strong></div>
      <div><span>Absent</span><strong>${absent}</strong></div>
      <div><span>Rate</span><strong>${rate}%</strong></div>
    </div>
    <p class="muted">Records: ${escapeHtml(from)} to ${escapeHtml(to)}</p>
  `;
}

function renderAttendanceList(school, classId, date) {
  const selectedClass = loadClasses().find((item) => item.schoolId === school.schoolId && item.classId === classId);
  const store = loadStore();
  const students = store.students.filter((student) => student.schoolId === school.schoolId && student.classId === classId);
  const records = loadAttendance();
  const existing = new Map(records.filter((record) => record.schoolId === school.schoolId && record.classId === classId && record.date === date).map((record) => [record.studentId, String(record.status).toLowerCase()]));
  const container = document.querySelector("#attendance-record-form");
  if (!container) return;
  if (!selectedClass) { container.innerHTML = '<p class="empty">Select a valid class.</p>'; return; }
  if (!students.length) { container.innerHTML = '<div class="form-card"><h3>'+escapeHtml(selectedClass.name)+'</h3><p class="muted">No approved students are enrolled in this class.</p></div>'; return; }

  container.innerHTML = `
    <div class="section-heading"><div><h3>${escapeHtml(selectedClass.name)}</h3><p class="muted">${escapeHtml(date)}</p></div></div>
    <form class="form-card" id="attendance-form">
      <div class="table-wrap"><table><thead><tr><th>Student</th><th>Admission number</th><th>Attendance</th></tr></thead><tbody>
      ${students.map((student) => {
        const status = existing.get(student.studentId) || "present";
        return `<tr><td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.admissionNumber || "N/A")}</td><td><select name="status:${escapeHtml(student.studentId)}" required><option value="present" ${status === "present" ? "selected" : ""}>Present</option><option value="absent" ${status === "absent" ? "selected" : ""}>Absent</option></select></td></tr>`;
      }).join("")}
      </tbody></table></div>
      <div class="form-actions"><button class="primary-button" type="submit">Save attendance</button></div>
    </form>`;

  document.querySelector("#attendance-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = loadAttendance().filter((record) => !(record.schoolId === school.schoolId && record.classId === classId && record.date === date));
    const now = new Date().toISOString();
    for (const student of students) {
      const status = String(data.get("status:" + student.studentId) || "present").toLowerCase();
      next.push({attendanceId:id("attendance"),schoolId:school.schoolId,classId,studentId:student.studentId,sessionId:String(school.session?.sessionId || school.session?.name || ""),termId:String(school.term?.termId || school.term?.name || ""),date,status,createdAt:now,updatedAt:now});
    }
    saveAttendance(next);
    renderAttendanceList(school, classId, date);
    renderAttendanceSummary(school, classId, date);
    const notice = document.querySelector("#attendance-record-form");
    if (notice) notice.insertAdjacentHTML("afterbegin", '<div class="notice"><strong>Attendance saved successfully.</strong></div>');
  });
}


const RESULTS_STORAGE_KEY = "skulgo.admin.results.v1";
const GRADE_SCALE_STORAGE_KEY = "skulgo.admin.grade-scale.v1";
const REMARK_BANDS_STORAGE_KEY = "skulgo.admin.remark-bands.v1";
const STUDENT_REMARKS_STORAGE_KEY = "skulgo.admin.student-remarks.v1";
const DEFAULT_REMARK_BANDS = [
  { label: "1", title: "Excellent", minimumAverage: 70, remark: "Outstanding performance. Keep reaching for greater heights." },
  { label: "2", title: "Very Good", minimumAverage: 60, remark: "Very good performance. Continue working hard and aim even higher." },
  { label: "3", title: "Good", minimumAverage: 50, remark: "Good performance. Keep pushing yourself to achieve even more." },
  { label: "4", title: "Fair", minimumAverage: 40, remark: "A fair performance. Put in more effort next term and you can improve." },
  { label: "5", title: "Needs Improvement", minimumAverage: 0, remark: "Do not give up. Stay focused and work consistently; you can improve." }
];

function loadRemarkBands() {
  try {
    const parsed = JSON.parse(readStorage(REMARK_BANDS_STORAGE_KEY) || "null");
    return parsed && Array.isArray(parsed.bands) && parsed.bands.length ? parsed.bands : { bands: DEFAULT_REMARK_BANDS };
  } catch {
    return { bands: DEFAULT_REMARK_BANDS };
  }
}

function saveRemarkBands(bands) {
  writeStorage(REMARK_BANDS_STORAGE_KEY, JSON.stringify({ bands }));
}
function loadStudentRemarks() {
  try {
    const parsed = JSON.parse(readStorage(STUDENT_REMARKS_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStudentRemark(key, value) {
  const remarks = loadStudentRemarks();
  remarks[key] = value;
  writeStorage(STUDENT_REMARKS_STORAGE_KEY, JSON.stringify(remarks));
}

function getRemarkForAverage(average, remarkBands) {
  if (!Number.isFinite(Number(average)) || !remarkBands?.bands?.length) return null;
  return [...remarkBands.bands].sort((a,b) => Number(b.minimumAverage ?? 0) - Number(a.minimumAverage ?? 0))
    .find((band) => Number(average) >= Number(band.minimumAverage ?? 0)) || null;
}

function loadResultsRecords() {
  try {
    const parsed = JSON.parse(readStorage(RESULTS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const DEFAULT_GRADE_BANDS = [
  { grade: "A", min: 70, max: 100 },
  { grade: "B", min: 60, max: 69.99 },
  { grade: "C", min: 50, max: 59.99 },
  { grade: "D", min: 45, max: 49.99 },
  { grade: "E", min: 40, max: 44.99 },
  { grade: "F", min: 0, max: 39.99 }
];

function loadGradeScale() {
  try {
    const parsed = JSON.parse(readStorage(GRADE_SCALE_STORAGE_KEY) || "null");
    if (parsed && Array.isArray(parsed.bands) && parsed.bands.length) return parsed;
  } catch {}
  const bands = DEFAULT_GRADE_BANDS.map((band) => ({ ...band }));
  return { bands };
}

function saveGradeScale(bands) {
  writeStorage(GRADE_SCALE_STORAGE_KEY, JSON.stringify({ bands }));
}

function calculateResultTotal(record) {
  const assessments = Array.isArray(record?.caAssessments) ? record.caAssessments : [];
  const ca = assessments.length
    ? assessments.reduce((sum, item) => sum + (Number.isFinite(Number(item.score)) ? Number(item.score) : 0), 0)
    : (Number.isFinite(Number(record?.ca)) ? Number(record.ca) : undefined);
  const exam = Number.isFinite(Number(record?.exam)) ? Number(record.exam) : undefined;
  const values = [ca, exam].filter((value) => value !== undefined);
  return values.length ? values.reduce((sum, value) => sum + value, 0) : undefined;
}

function calculateResultGrade(total, scale, maximumTotal = 100) {
  if (total === undefined || !scale?.bands?.length) return undefined;

  // New Grade Band format: percentage ranges A–F.
  if (scale.bands.every((band) => band.grade !== undefined)) {
    const maximum = Number(maximumTotal) > 0 ? Number(maximumTotal) : 100;
    const percentage = (Number(total) / maximum) * 100;
    return scale.bands.find((band) => percentage >= Number(band.min) && percentage <= Number(band.max))?.grade;
  }

  // Backward compatibility for older imported grade-scale records.
  const bands = [...scale.bands].sort((a, b) => Number(a.minimumTotal) - Number(b.minimumTotal));
  return bands.find((band) => total >= Number(band.minimumTotal) && total <= Number(band.maximumTotal))?.label;
}

function calculateResultPercentage(record) {
  const total = calculateResultTotal(record);
  if (!Number.isFinite(Number(total))) return undefined;
  const maximum = (Number(record?.caMaximum || 0) + Number(record?.examMaximum || 0));
  if (maximum <= 0) return undefined;
  return (Number(total) / maximum) * 100;
}

function getRequiredSubjectsForStudent(student, subjects) {
  return subjects.filter((subject) => {
    if (subject.classId !== student.classId || subject.status === "DISABLED") return false;
    const offeredTo = Array.isArray(subject.studentIds) ? subject.studentIds : [];
    return !offeredTo.length || offeredTo.includes(student.studentId);
  });
}

function getStudentResultStatus(student, subjects, records) {
  const requiredSubjects = getRequiredSubjectsForStudent(student, subjects);
  const completedSubjectIds = new Set(
    records
      .filter((record) =>
        record.studentId === student.studentId &&
        record.exam !== undefined &&
        Number.isFinite(Number(record.exam)) &&
        Number.isFinite(Number(calculateResultTotal(record)))
      )
      .map((record) => record.subjectId)
  );
  const completed = requiredSubjects.filter((subject) => completedSubjectIds.has(subject.subjectId)).length;
  return {
    required: requiredSubjects.length,
    completed,
    complete: requiredSubjects.length > 0 && completed === requiredSubjects.length
  };
}

function renderGradeBand() {
  const scale = loadGradeScale();
  page.innerHTML = '<div class="section-heading"><div><h2>Grade Band</h2><p class="muted">Default grading bands for this school. Change the minimum and maximum percentage as needed.</p></div></div>' +
    '<form class="form-card" id="grade-band-form"><div class="grade-band-grid">' +
    scale.bands.map((band, i) => {
      const grade = band.grade ?? band.label ?? "";
      const min = band.min ?? band.minimumTotal ?? 0;
      const max = band.max ?? band.maximumTotal ?? 100;
      return '<div class="grade-band-row"><strong>' + escapeHtml(grade) + '</strong>' +
        '<input name="min-' + i + '" type="number" min="0" max="100" step="0.01" value="' + escapeHtml(min) + '" aria-label="Minimum percentage for ' + escapeHtml(grade) + '">' +
        '<span>to</span>' +
        '<input name="max-' + i + '" type="number" min="0" max="100" step="0.01" value="' + escapeHtml(max) + '" aria-label="Maximum percentage for ' + escapeHtml(grade) + '">' +
        '</div>';
    }).join("") +
    '</div><div class="form-actions"><button class="primary-button">Save Grade Band</button><button type="button" class="small-button" id="reset-grade-band">Reset Default</button></div><p class="form-message" id="grade-band-message"></p></form>';

  document.querySelector("#grade-band-form").onsubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const bands = scale.bands.map((band, i) => ({
      grade: band.grade ?? band.label,
      min: Number(data.get("min-" + i)),
      max: Number(data.get("max-" + i))
    }));
    if (bands.some((band) => !Number.isFinite(band.min) || !Number.isFinite(band.max) || band.min < 0 || band.max > 100 || band.min > band.max)) {
      document.querySelector("#grade-band-message").textContent = "Each band must be between 0 and 100, with minimum not above maximum.";
      return;
    }
    saveGradeScale(bands);
    document.querySelector("#grade-band-message").textContent = "Grade band saved.";
  };

  document.querySelector("#reset-grade-band").onclick = () => {
    saveGradeScale(DEFAULT_GRADE_BANDS.map((band) => ({ ...band })));
    renderGradeBand();
  };
}

function renderResults() {
  const school = loadSchool();
  if (!school?.schoolId || !school?.session?.name || !school?.term?.name) {
    page.innerHTML = '<h2>Results</h2><p class="muted">Complete School Setup before viewing results.</p>';
    return;
  }

  const classes = loadClasses().filter((item) => item.schoolId === school.schoolId);
  const subjects = loadSubjects().filter((item) => item.schoolId === school.schoolId && item.status === "ACTIVE");
  const students = loadStore().students.filter((item) => item.schoolId === school.schoolId);
  const sessionId = school.session?.sessionId || school.session?.name || "";
  const termId = school.term?.termId || school.term?.name || "";

  page.innerHTML = `
    <div class="section-heading"><div><h2>Results</h2><p class="muted">View and enter student CA, exam, total and grade for the current academic period.</p></div></div>
    <form class="form-card" id="results-selector">
      <div class="form-grid">
        <label>Class<select name="classId" required><option value="">Select class</option>${classes.map((item) => `<option value="${escapeHtml(item.classId)}">${escapeHtml(item.name)}</option>`).join("")}</select></label>
        <label>Subject<select name="subjectId" required><option value="">Select subject</option>${subjects.map((item) => `<option value="${escapeHtml(item.subjectId)}">${escapeHtml(item.name)}</option>`).join("")}</select></label>
        <label>Session<input value="${escapeHtml(school.session.name)}" readonly></label>
        <label>Term<input value="${escapeHtml(school.term.name)}" readonly></label>
      </div>
      <div class="form-actions"><button class="primary-button" type="submit">Load Results</button></div>
    </form>
    <div id="results-list"></div>`;

  document.querySelector("#results-selector").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const classId = String(data.get("classId") || "");
    const subjectId = String(data.get("subjectId") || "");
    const selectedClass = classes.find((item) => item.classId === classId);
    const selectedSubject = subjects.find((item) => item.subjectId === subjectId);
    if (!selectedClass || !selectedSubject) return;

    const classStudents = students.filter((student) => student.classId === classId);
    const gradeScale = loadGradeScale();
    const allRecords = loadResultsRecords();
    const keyMatches = (record) => record.schoolId === school.schoolId && record.classId === classId && record.subjectId === subjectId &&
      String(record.sessionId || "") === String(sessionId) && String(record.termId || "") === String(termId);
    const records = allRecords.filter(keyMatches);

    const renderEntry = (kind) => {
      const label = kind === "ca" ? "CA" : "Exam";
      const defaultMax = kind === "ca" ? 20 : 60;
      page.innerHTML = `
        <div class="section-heading"><div><h2>Add ${label}</h2><p class="muted">${escapeHtml(selectedSubject.name)} · ${escapeHtml(selectedClass.name)}</p></div><button class="small-button" type="button" id="back-results">Back</button></div>
        <form class="form-card" id="admin-result-entry-form">
          <div class="form-grid">
            <label>${label} name<input name="name" value="${label === "CA" ? "CA 1" : "EXAM"}" required></label>
            <label>Maximum score<input name="maximumScore" type="number" min="1" step="1" value="${defaultMax}" required></label>
            <label>Date<input name="date" type="date" value="${new Date().toISOString().slice(0,10)}" required></label>
          </div>
          <div class="card"><h3>Student Scores</h3><p class="muted">Enter one score for each student offering this subject.</p>
            ${classStudents.length ? classStudents.map((student) => `<div class="score-row"><div class="score-student"><strong>${escapeHtml(student.name)}</strong></div><input name="score-${escapeHtml(student.studentId)}" type="number" min="0" step="0.01" placeholder="0 - ${defaultMax}" aria-label="${escapeHtml(label)} score for ${escapeHtml(student.name)}"></div>`).join("") : '<div class="empty">No students are enrolled in this class.</div>'}
          </div>
          <div class="form-actions"><button class="primary-button" type="submit">Save ${label} Scores</button><button class="small-button" type="button" id="cancel-admin-result-entry">Cancel</button></div>
          <p class="form-message" id="admin-result-entry-message"></p>
        </form>`;

      document.querySelector("#back-results").onclick = () => renderResults();
      document.querySelector("#cancel-admin-result-entry").onclick = () => renderResults();
      document.querySelector("#admin-result-entry-form").onsubmit = (e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        const maximumScore = Number(d.get("maximumScore"));
        const message = document.querySelector("#admin-result-entry-message");
        if (!Number.isFinite(maximumScore) || maximumScore <= 0) { message.textContent = "Maximum score must be greater than zero."; return; }

        const all = loadResultsRecords();
        const existing = new Map(all.filter(keyMatches).map((record) => [record.studentId, record]));
        for (const student of classStudents) {
          const raw = d.get("score-" + student.studentId);
          if (raw === null || String(raw).trim() === "") continue;
          const score = Number(raw);
          if (!Number.isFinite(score) || score < 0 || score > maximumScore) { message.textContent = "Each score must be between 0 and the maximum score."; return; }
          const previous = existing.get(student.studentId) || {};
          const record = { ...previous, resultId: previous.resultId || id("result"), schoolId: school.schoolId, classId, subjectId, studentId: student.studentId, sessionId, termId };
          if (kind === "ca") {
            const oldAssessments = Array.isArray(record.caAssessments) ? record.caAssessments : (record.ca !== undefined ? [{ name: record.caName || "CA 1", score: Number(record.ca), maximumScore: Number(record.caMaximum || 20), date: record.caDate || "" }] : []);
            const name = String(d.get("name") || "CA").trim();
            const next = oldAssessments.filter((item) => String(item.name || "") !== name);
            next.push({ name, score, maximumScore, date: String(d.get("date") || "") });
            record.caAssessments = next;
            record.ca = next.reduce((sum, item) => sum + Number(item.score || 0), 0);
            record.caName = next.map((item) => item.name).join(", ");
            record.caMaximum = next.reduce((sum, item) => sum + Number(item.maximumScore || 0), 0);
            record.caDate = String(d.get("date") || "");
          } else {
            record.exam = score; record.examName = String(d.get("name") || "EXAM").trim(); record.examMaximum = maximumScore; record.examDate = String(d.get("date") || "");
          }
          existing.set(student.studentId, record);
        }
        const untouched = all.filter((record) => !keyMatches(record));
        writeStorage(RESULTS_STORAGE_KEY, JSON.stringify([...untouched, ...existing.values()]));
        renderResults();
      };
    };

    const assessmentSource = records[0]?.caAssessments || (records[0]?.ca !== undefined ? [{ name: records[0]?.caName || "CA 1", maximumScore: records[0]?.caMaximum || 20 }] : []);
    const examExists = records.some((record) => record.exam !== undefined);
    document.querySelector("#results-list").innerHTML = `
      <div class="section-heading"><div><h3>${escapeHtml(selectedSubject.name)}</h3><p class="muted">${escapeHtml(selectedClass.name)} · ${classStudents.length} students</p></div></div>
      <div class="card"><h3>Subject role</h3><p>Admin — CA, exams and results for this subject.</p><div class="form-actions"><button class="primary-button" type="button" id="admin-add-ca">+ Add CA</button><button class="primary-button" type="button" id="admin-add-exam">${examExists ? "Open Exam" : "+ Add Exam"}</button></div></div>
      <div class="card"><h3>Students</h3><p class="muted">CA is calculated from every CA added for this subject. Add CA1, CA2, CA3, CA4 or more — the CA total updates automatically.</p>
        ${classStudents.length ? `<div class="student-results">${classStudents.map((student) => {
          const record = records.find((item) => item.studentId === student.studentId);
          const total = record ? calculateResultTotal(record) : undefined;
          const grade = calculateResultGrade(total, gradeScale, (Number(record?.caMaximum || 0) + Number(record?.examMaximum || 0)) || 100);
          const ca = record ? (Array.isArray(record.caAssessments) ? record.caAssessments.reduce((sum,item)=>sum+Number(item.score||0),0) : Number(record.ca||0)) : undefined;
          return `<div class="student-result-row"><div class="student-result-main"><strong>${escapeHtml(student.name)}</strong></div><div class="result-number"><span class="result-label">CA</span><strong>${record ? ca : "—"}</strong><small>/ ${record?.caMaximum ?? "—"}</small></div><div class="result-number"><span class="result-label">EXAM</span><strong>${record?.exam ?? "—"}</strong><small>/ ${record?.examMaximum ?? "—"}</small></div><div class="result-number total"><span class="result-label">TOTAL</span><strong>${total ?? "—"}</strong><small>/ ${(Number(record?.caMaximum||0)+Number(record?.examMaximum||0)) || "—"}</small></div><div class="result-grade"><span class="result-label">GRADE</span><strong>${grade ?? "—"}</strong></div></div>`;
        }).join("")}</div>` : '<div class="empty">No students are enrolled in this class.</div>'}
      </div>
      <div class="card"><h3>CA assessments</h3>${assessmentSource.length ? assessmentSource.map((a)=>`<div class="student-row"><div><strong>${escapeHtml(a.name || "CA")}</strong><div class="student-id">Maximum score: ${escapeHtml(a.maximumScore ?? "")}</div></div></div>`).join("") : '<div class="empty">No CA assessment yet.</div>'}</div>
      <div class="card"><h3>Exam</h3>${examExists ? '<div class="student-row"><div><strong>EXAM</strong><div class="student-id">Maximum score: '+escapeHtml(records.find(r=>r.examMaximum)?.examMaximum || 60)+'</div></div></div>' : '<div class="empty">No Exam yet.</div>'}</div>
    `;

    document.querySelector("#admin-add-ca").onclick = () => renderEntry("ca");
    document.querySelector("#admin-add-exam").onclick = () => renderEntry("exam");
  });
}

const REPORT_PUBLISH_STORAGE_KEY = "skulgo.admin.report-card-published.v1";
function loadPublishedReports(){try{const p=JSON.parse(readStorage(REPORT_PUBLISH_STORAGE_KEY)||"{}");return p&&typeof p==="object"?p:{};}catch{return {};}}
function reportPublishKey(school,student){return [school.schoolId,school.session?.name,school.term?.name,student.studentId].join("|");}
function savePublishedReport(key){const p=loadPublishedReports();p[key]={publishedAt:new Date().toISOString()};writeStorage(REPORT_PUBLISH_STORAGE_KEY,JSON.stringify(p));}
function isReportPublished(key){return Boolean(loadPublishedReports()[key]);}
function printReportCards(html,titleText){const w=window.open("","_blank","width=1000,height=800");if(!w)return;w.document.write("<!doctype html><html><head><title>"+escapeHtml(titleText)+"</title><style>body{font-family:Arial,sans-serif;margin:0}.report-card-paper{break-after:page;max-width:900px;margin:20px auto;padding:28px;border:1px solid #ddd}.report-card-paper:last-child{break-after:auto}</style></head><body>"+html+"</body></html>");w.document.close();w.focus();setTimeout(()=>w.print(),300);}
function renderReportCard() {
  const school = loadSchool();
  if (!school?.schoolId || !school?.session?.name || !school?.term?.name) {
    page.innerHTML = '<h2>Report Card</h2><p class="muted">Complete School Setup before viewing report cards.</p>';
    return;
  }

  const classes = loadClasses().filter((item) => item.schoolId === school.schoolId);
  const students = loadStore().students.filter((item) => item.schoolId === school.schoolId);
  const subjects = loadSubjects().filter((item) => item.schoolId === school.schoolId && item.status === "ACTIVE");
  const records = loadResultsRecords().filter((item) =>
    item.schoolId === school.schoolId &&
    String(item.sessionId || "") === String(school.session?.sessionId || school.session?.name || "") &&
    String(item.termId || "") === String(school.term?.termId || school.term?.name || "")
  );
  const attendance = loadAttendance().filter((item) =>
    item.schoolId === school.schoolId &&
    String(item.termId || "") === String(school.term?.termId || school.term?.name || "") &&
    String(item.sessionId || "") === String(school.session?.sessionId || school.session?.name || "")
  );
  const gradeScale = loadGradeScale();

  const studentStats = new Map();
  for (const student of students) {
    const studentRecords = records.filter((record) => record.studentId === student.studentId);
    const percentages = studentRecords.map((record) => calculateResultPercentage(record)).filter((value) => Number.isFinite(value));
    const status = getStudentResultStatus(student, subjects, records);
    const average = percentages.length ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length : 0;
    studentStats.set(student.studentId, {
      student,
      subjectCount: percentages.length,
      average,
      requiredSubjectCount: status.required,
      completedSubjectCount: status.completed,
      complete: status.complete
    });
  }

  // Ranking only uses students whose required subjects are all complete.
  // This prevents a partially submitted class from producing misleading positions.
  const ranked = [...studentStats.values()]
    .filter((item) => item.complete)
    .sort((a, b) => b.average - a.average || String(a.student.name).localeCompare(String(b.student.name)));

  const classRanks = new Map();
  for (const classItem of classes) {
    const classStudents = students.filter((student) => student.classId === classItem.classId);
    const classComplete = classStudents.length > 0 && classStudents.every((student) => studentStats.get(student.studentId)?.complete);
    if (!classComplete) continue;

    const classRanked = ranked.filter((item) => item.student.classId === classItem.classId);
    let position = 0;
    let previousAverage = null;
    classRanked.forEach((item, index) => {
      const counted = index + 1;
      if (previousAverage === null || item.average !== previousAverage) position = counted;
      classRanks.set(item.student.studentId, { position, total: classRanked.length });
      previousAverage = item.average;
    });
  }

  // School-wide positions are released only when every enrolled student in every class
  // has completed all required subjects for the current session and term.
  const schoolComplete = students.length > 0 && students.every((student) => studentStats.get(student.studentId)?.complete);
  const schoolRanks = new Map();
  if (schoolComplete) {
    let schoolPosition = 0;
    let previousSchoolAverage = null;
    ranked.forEach((item, index) => {
      const counted = index + 1;
      if (previousSchoolAverage === null || item.average !== previousSchoolAverage) schoolPosition = counted;
      schoolRanks.set(item.student.studentId, { position: schoolPosition, total: ranked.length });
      previousSchoolAverage = item.average;
    });
  }

  const ordinal = (value) => {
    const n = Number(value);
    if (n % 100 >= 11 && n % 100 <= 13) return n + "th";
    return n % 10 === 1 ? n + "st" : n % 10 === 2 ? n + "nd" : n % 10 === 3 ? n + "rd" : n + "th";
  };

  const remarkBands = loadRemarkBands();

  page.innerHTML = `
    <div class="report-card-selector-wrap">
      <div class="section-heading">
        <div><h2>Report Card</h2><p class="muted">Generate the student's term report from existing school records.</p></div>
      </div>

      <form class="form-card" id="report-card-selector">
        <div class="form-grid">
          <label>Report Type<select name="reportType" required><option value="">Select report type</option><option value="student">Student</option><option value="class">Class</option><option value="section">Section</option><option value="school">Whole School</option></select></label>
          <label id="report-target-label">Selection<select name="targetId" required><option value="">Select</option></select></label>
        </div>
        <div class="form-actions">
          <button class="primary-button" type="submit">Load Report Card</button>
          <button class="small-button" type="button" id="print-class-reports">Print Class</button>
          <button class="small-button" type="button" id="print-all-reports">Print All</button>
        </div>
      </form>
    </div>
    <div id="report-card-output"></div>
  `;

  const reportTypeSelect = document.querySelector("#report-card-selector [name=reportType]");
  const targetLabel = document.querySelector("#report-target-label");
  const targetSelect = document.querySelector("#report-card-selector [name=targetId]");
  const sections = [...new Map(classes.map((item) => [item.sectionId || item.sectionName, { sectionId: item.sectionId || item.sectionName, name: item.sectionName || item.sectionId }])).values()];

  reportTypeSelect.addEventListener("change", () => {
    const type = reportTypeSelect.value;
    targetSelect.required = type !== "school";
    targetSelect.innerHTML = "";
    if (type === "student") {
      targetLabel.firstChild.textContent = "Student";
      targetSelect.innerHTML = '<option value="">Select student</option>' + students.map((student) => `<option value="${escapeHtml(student.studentId)}">${escapeHtml(student.name)}</option>`).join("");
    } else if (type === "class") {
      targetLabel.firstChild.textContent = "Class";
      targetSelect.innerHTML = '<option value="">Select class</option>' + classes.map((item) => `<option value="${escapeHtml(item.classId)}">${escapeHtml(item.name)}</option>`).join("");
    } else if (type === "section") {
      targetLabel.firstChild.textContent = "Section";
      targetSelect.innerHTML = '<option value="">Select section</option>' + sections.map((item) => `<option value="${escapeHtml(item.sectionId)}">${escapeHtml(item.name)}</option>`).join("");
    } else if (type === "school") {
      targetLabel.firstChild.textContent = "Selection";
      targetSelect.innerHTML = '<option value="school">Whole School</option>';
      targetSelect.value = "school";
    } else {
      targetLabel.firstChild.textContent = "Selection";
      targetSelect.innerHTML = '<option value="">Select</option>';
    }
  });

  const printBatchReports = (studentList, label) => {
    const published = loadPublishedReports();
    const printable = [];
    for (const student of studentList) {
      const key = reportPublishKey(school, student);
      if (!published[key]) continue;
      const classItem = classes.find((item) => item.classId === student.classId);
      if (!classItem) continue;
      classSelect.value = classItem.classId;
      studentSelect.innerHTML = '<option value="' + escapeHtml(student.studentId) + '">' + escapeHtml(student.name) + '</option>';
      studentSelect.value = student.studentId;
      document.querySelector("#report-card-selector").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      const paper = document.querySelector("#report-card-output .report-card-paper");
      if (paper) {
        const clone = paper.cloneNode(true);
        clone.querySelectorAll(".report-card-actions,.report-card-custom-remarks").forEach((el) => el.remove());
        printable.push(clone.outerHTML);
      }
    }
    if (!printable.length) {
      alert("No published report cards are available for " + label + ".");
      return;
    }
    printReportCards(printable.join(""), "Published Report Cards — " + label);
  };

  document.querySelector("#print-class-reports").addEventListener("click", () => {
    if (!classSelect.value) { alert("Select a class first."); return; }
    printBatchReports(students.filter((student) => student.classId === classSelect.value), classes.find((item) => item.classId === classSelect.value)?.name || "Class");
  });

  document.querySelector("#print-all-reports").addEventListener("click", () => {
    printBatchReports(students, "All Classes");
  });

  let renderingBatch = false;

  document.querySelector("#report-card-selector").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const reportType = String(data.get("reportType") || "");
    const targetId = String(data.get("targetId") || "");

    let selectedStudents = [];
    if (reportType === "student") {
      const student = students.find((item) => String(item.studentId) === targetId);
      if (student) selectedStudents = [student];
    } else if (reportType === "class") {
      selectedStudents = students.filter((item) => String(item.classId) === targetId);
    } else if (reportType === "section") {
      const classIds = new Set(classes.filter((item) => String(item.sectionId || item.sectionName) === targetId).map((item) => item.classId));
      selectedStudents = students.filter((item) => classIds.has(item.classId));
    } else if (reportType === "school") {
      selectedStudents = students.slice();
    }

    if (!selectedStudents.length) {
      document.querySelector("#report-card-output").innerHTML = '<p class="muted">No students found for this selection.</p>';
      return;
    }

    // Batch reports are shown in rank order when results exist.
    if (reportType !== "student") {
      selectedStudents.sort((a, b) => {
        const ar = classRanks.get(a.studentId);
        const br = classRanks.get(b.studentId);
        const as = schoolRanks.get(a.studentId);
        const bs = schoolRanks.get(b.studentId);
        const ra = reportType === "class" ? ar : (reportType === "section" || reportType === "school" ? as : null);
        const rb = reportType === "class" ? br : (reportType === "section" || reportType === "school" ? bs : null);
        if (ra && rb) return ra.position - rb.position || String(a.name).localeCompare(String(b.name));
        if (ra) return -1;
        if (rb) return 1;
        return String(a.name).localeCompare(String(b.name));
      });
    }

    if (selectedStudents.length > 1 && !renderingBatch) {
      const form = event.currentTarget;
      const originalType = reportTypeSelect.value;
      const originalTarget = targetSelect.value;
      const reports = [];
      renderingBatch = true;
      try {
        selectedStudents.forEach((item) => {
          reportTypeSelect.value = "student";
          targetSelect.innerHTML = '<option value="' + escapeHtml(item.studentId) + '">' + escapeHtml(item.name) + '</option>';
          targetSelect.value = item.studentId;
          form.requestSubmit();
          const rendered = document.querySelector("#report-card-output").innerHTML;
          reports.push(rendered.replace(/<div class="report-card-actions">[\s\S]*?<\/div>/, ""));
        });
      } finally {
        renderingBatch = false;
        reportTypeSelect.value = originalType;
        targetSelect.innerHTML = '<option value="">Select</option>';
        targetSelect.value = originalTarget;
      }
      document.querySelector("#report-card-output").innerHTML =
        '<div class="report-card-batch-heading"><h3>' + escapeHtml(selectedStudents.length + " Report Cards") + '</h3></div>' +
        reports.join('<div class="report-card-page-break"></div>');
      return;
    }

    const student = selectedStudents[0];
    const classItem = classes.find((item) => item.classId === student.classId);
    if (!classItem) {
      document.querySelector("#report-card-output").innerHTML = '<p class="muted">The selected student has no class record.</p>';
      return;
    }

    const studentRecords = records.filter((record) => record.studentId === student.studentId && record.classId === classItem.classId);
    const subjectsById = new Map(subjects.map((subject) => [subject.subjectId, subject]));
    const resultRows = studentRecords.map((record) => {
      const total = calculateResultTotal(record);
      return {
        subject: subjectsById.get(record.subjectId)?.name || record.subjectName || "Subject",
        exam: record.exam ?? "N/A",
        total: total ?? "N/A",
        grade: calculateResultGrade(total, gradeScale, (Number(record?.caMaximum || 0) + Number(record?.examMaximum || 0)) || 100) || "N/A"
      };
    });

    const studentAttendance = attendance.filter((record) => record.studentId === student.studentId && record.classId === classItem.classId);
    const present = studentAttendance.filter((record) => String(record.status).toLowerCase() === "present").length;
    const absent = studentAttendance.filter((record) => String(record.status).toLowerCase() === "absent").length;
    const attendanceTotal = present + absent;
    const attendanceRate = attendanceTotal ? Math.round((present / attendanceTotal) * 100) : 0;
    const stats = studentStats.get(student.studentId) || { average: 0, subjectCount: 0 };
    const overallGrade = stats.complete ? calculateResultGrade(stats.average, gradeScale) : "";
    const overallBand = stats.complete ? getRemarkForAverage(stats.average, loadRemarkBands()) : null;
    const overallRemark = overallBand?.remark || "";
    const defaultPrincipalRemark = overallBand ? `A ${overallBand.title.toLowerCase()} performance. ${overallBand.remark}` : "";
    const classRank = classRanks.get(student.studentId);
    const schoolRank = schoolRanks.get(student.studentId);

    const remarksKey = [school.schoolId, school.session?.name, school.term?.name, student.studentId].join("|");
    const savedStudentRemarks = loadStudentRemarks()[remarksKey] || {};
    const published = isReportPublished(remarksKey);
    document.querySelector("#report-card-output").innerHTML = `
      <div class="report-card-actions">
        <button type="button" class="primary-button" id="publish-report-card">${published ? "Published Officially" : "Publish Report Card"}</button>
        <button type="button" class="small-button" id="share-report-card">Share</button>
        <button type="button" class="small-button" id="print-report-card">Print</button>
      </div>
      <article class="report-card-paper">
        <header class="report-card-header">
          <div>
            <div class="report-card-kicker">ACADEMIC REPORT</div>
            <h2>${escapeHtml(school.name)}</h2>
            <p>${escapeHtml(school.address || "")}</p>
            <p>${escapeHtml([school.phone, school.email].filter(Boolean).join("  •  "))}</p>
          </div>
          <div class="report-card-title">
            <span>REPORT CARD</span>
            <strong>${escapeHtml(school.term.name)}</strong>
          </div>
        </header>

        <section class="report-card-student">
          <div><span>Student</span><strong>${escapeHtml(student.name)}</strong></div>
          <div><span>Student ID</span><strong>${escapeHtml(student.admissionNumber || student.studentId || "N/A")}</strong></div>
          <div><span>Class</span><strong>${escapeHtml(classItem.name)}</strong></div>
          <div><span>Academic Session</span><strong>${escapeHtml(school.session.name)}</strong></div>
        </section>

        <section class="report-card-summary">
          <div><span>Average</span><strong>${stats.complete ? stats.average.toFixed(2) + "%" : "Pending"}</strong></div>
          <div><span>Subjects Complete</span><strong>${stats.completedSubjectCount} / ${stats.requiredSubjectCount}</strong></div>
          <div><span>Class Rank</span><strong>${stats.complete && classRank ? ordinal(classRank.position) + " / " + classRank.total : "Pending"}</strong></div>
          <div><span>School Overall Rank</span><strong>${stats.complete && schoolRank ? ordinal(schoolRank.position) + " / " + schoolRank.total : "Pending"}</strong></div>
        </section>

        <section class="report-card-remark">
          <span>Overall Remark</span>
          <strong>${escapeHtml(stats.complete ? (overallRemark || "N/A") : "Result pending — not all required subjects are complete.")}</strong>
        </section>

        <section class="report-card-remarks-section">
          <div class="report-card-remark"><span>Overall Performance</span><strong>${escapeHtml(overallBand ? "Level " + overallBand.label + " — " + overallBand.title : "N/A")}</strong><p>${escapeHtml(overallRemark || "N/A")}</p></div>
          <div class="report-card-custom-remarks">
            <label>Class Teacher's Remark<textarea id="class-teacher-remark" rows="2" placeholder="Enter a custom class teacher remark...">${escapeHtml(savedStudentRemarks.classTeacher || "")}</textarea></label>
            <label>Principal's Remark<textarea id="principal-remark" rows="2">${escapeHtml(savedStudentRemarks.principal || defaultPrincipalRemark)}</textarea></label>
            <label>Encouragement<textarea id="encouragement-remark" rows="2" placeholder="Enter an encouraging message...">${escapeHtml(savedStudentRemarks.encouragement || "")}</textarea></label><div class="form-actions"><button type="button" class="primary-button" id="save-report-remarks">Save Remarks</button></div>
          </div>
        </section>

        <section class="report-card-section">
          <div class="report-card-section-heading"><h3>Academic Results</h3><span>${escapeHtml(school.term.name)}</span></div>
          <div class="report-card-table-wrap">
            <table class="report-card-table">
              <thead><tr><th>Subject</th><th>Exam</th><th>Total</th><th>Grade</th></tr></thead>
              <tbody>${resultRows.length ? resultRows.map((row) => `<tr><td>${escapeHtml(row.subject)}</td><td>${escapeHtml(row.exam)}</td><td>${escapeHtml(row.total)}</td><td><strong>${escapeHtml(row.grade)}</strong></td></tr>`).join("") : '<tr><td colspan="4" class="report-card-empty">No result records for this student.</td></tr>'}</tbody>
            </table>
          </div>
        </section>

        <section class="report-card-section">
          <div class="report-card-section-heading"><h3>Attendance</h3><span>${attendanceTotal} record${attendanceTotal === 1 ? "" : "s"}</span></div>
          <div class="report-card-attendance">
            <div><span>Present</span><strong>${present}</strong></div>
            <div><span>Absent</span><strong>${absent}</strong></div>
            <div><span>Attendance Rate</span><strong>${attendanceRate}%</strong></div>
          </div>
        </section>

        <footer class="report-card-footer">
          <span>${escapeHtml(school.name)}</span>
          <span>${escapeHtml(school.session.name)} • ${escapeHtml(school.term.name)}</span>
        </footer>
      </article>
    `;

    document.querySelector("#save-report-remarks").addEventListener("click", () => {
      saveStudentRemark(remarksKey, {
        classTeacher: document.querySelector("#class-teacher-remark").value.trim(),
        principal: document.querySelector("#principal-remark").value.trim(),
        encouragement: document.querySelector("#encouragement-remark").value.trim()
      });
      document.querySelector("#save-report-remarks").insertAdjacentHTML("afterend", '<span class="notice-inline">Remarks saved.</span>');
    });
  });
}



function escapePdfText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

function createBackupPdf(school, classItem, students, subjects, assignments, attendance, results, backupPayload) {
  const lines = [
    school.name || "SkulGo School",
    "BACKUP RECORD",
    "",
    "Class: " + (classItem.name || ""),
    "Academic Session: " + (school.session?.name || ""),
    "Term: " + (school.term?.name || ""),
    "",
    "STUDENTS",
    ...students.map((student, index) =>
      (index + 1) + ". " + (student.name || "") + " | ID: " + (student.studentId || "") +
      " | " + (student.gender || student.sex || "") + " | " + (student.status || "ACTIVE")
    ),
    "",
    "SUBJECTS",
    ...subjects.map((subject, index) => (index + 1) + ". " + (subject.name || "")),
    "",
    "TEACHING ASSIGNMENTS",
    ...assignments.map((assignment, index) =>
      (index + 1) + ". Subject ID: " + (assignment.subjectId || "N/A") +
      " | Teacher ID: " + (assignment.teacherId || "N/A")
    ),
    "",
    "RECORD SUMMARY",
    "Attendance records: " + attendance.length,
    "Result records: " + results.length,
    "",
    "BACKUP DATA",
    ...encodeBackupPayload(backupPayload).match(/.{1,160}/g).map((chunk) => "SKULGO_DATA:" + chunk),
    "",
    "Created by SkulGo App",
    "Created: " + new Date().toLocaleString()
  ];

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 48;
  const lineHeight = 14;
  const maxLines = Math.floor((pageHeight - 2 * margin) / lineHeight);
  const pages = [];
  for (let i = 0; i < lines.length; i += maxLines) pages.push(lines.slice(i, i + maxLines));
  if (!pages.length) pages.push(["SkulGo App Backup"]);

  const objects = [];
  const addObject = (value) => { objects.push(value); return objects.length; };

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("PAGES_PLACEHOLDER");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = [];

  for (const pageLines of pages) {
    const commands = ["BT", "/F1 10 Tf", margin + " " + (pageHeight - margin) + " Td"];
    pageLines.forEach((line, index) => {
      if (index > 0) commands.push("0 -" + lineHeight + " Td");
      commands.push("(" + escapePdfText(line) + ") Tj");
    });
    commands.push("ET");
    const stream = commands.join("\\n");
    const streamId = addObject("<< /Length " + stream.length + " >>\\nstream\\n" + stream + "\\nendstream");
    const pageId = addObject("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pageWidth + " " + pageHeight + "] /Resources << /Font << /F1 3 0 R >> >> /Contents " + streamId + " 0 R >>");
    pageIds.push(pageId);
  }

  objects[pagesId - 1] = "<< /Type /Pages /Kids [" + pageIds.map(id => id + " 0 R").join(" ") + "] /Count " + pageIds.length + " >>";

  let pdf = "%PDF-1.4\\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length;
    pdf += (index + 1) + " 0 obj\\n" + object + "\\nendobj\\n";
  });
  const xrefOffset = pdf.length;
  pdf += "xref\\n0 " + (objects.length + 1) + "\\n";
  pdf += "0000000000 65535 f \\n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \\n";
  }
  pdf += "trailer\\n<< /Size " + (objects.length + 1) + " /Root " + catalogId + " 0 R >>\\n";
  pdf += "startxref\\n" + xrefOffset + "\\n%%EOF";

  return new Blob([pdf], { type: "application/pdf" });
}

function downloadBackupPdf(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


function encodeBackupPayload(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function decodeBackupPayload(encoded) {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function normalizeBackupPayload(pkg) {
  return {
    ...pkg,
    school: {
      schoolId: String(pkg.school?.schoolId || ""),
      name: String(pkg.school?.name || ""),
      session: pkg.school?.session || null,
      term: pkg.school?.term || null
    },
    class: {
      classId: String(pkg.class?.classId || ""),
      name: String(pkg.class?.name || ""),
      sectionId: pkg.class?.sectionId || null
    },
    students: Array.isArray(pkg.students) ? pkg.students.map(student => ({
      ...student,
      studentId: String(student.studentId || "").trim(),
      name: String(student.name || "").trim(),
      gender: String(student.gender || student.sex || "").trim(),
      status: String(student.status || "ACTIVE").trim(),
      classId: String(student.classId || pkg.class?.classId || "").trim()
    })).filter(student => student.studentId && student.name) : [],
    subjects: Array.isArray(pkg.subjects) ? pkg.subjects.map(subject => ({
      ...subject,
      subjectId: String(subject.subjectId || "").trim(),
      name: String(subject.name || "").trim(),
      classId: String(subject.classId || pkg.class?.classId || "").trim(),
      status: String(subject.status || "ACTIVE").trim(),
      studentIds: Array.isArray(subject.studentIds) ? subject.studentIds.map(String) : []
    })).filter(subject => subject.subjectId && subject.name) : [],
    assignments: Array.isArray(pkg.assignments) ? pkg.assignments.map(assignment => ({
      ...assignment,
      assignmentId: assignment.assignmentId || assignment.id || null,
      teacherId: assignment.teacherId ? String(assignment.teacherId) : null,
      subjectId: assignment.subjectId ? String(assignment.subjectId) : null,
      classId: String(assignment.classId || pkg.class?.classId || "").trim()
    })).filter(assignment => assignment.classId) : [],
    records: {
      attendance: Array.isArray(pkg.records?.attendance) ? pkg.records.attendance.map(record => ({
        ...record,
        classId: String(record.classId || pkg.class?.classId || "").trim(),
        studentId: String(record.studentId || "").trim()
      })).filter(record => record.classId && record.studentId) : [],
      results: Array.isArray(pkg.records?.results) ? pkg.records.results.map(record => ({
        ...record,
        classId: String(record.classId || pkg.class?.classId || "").trim(),
        studentId: String(record.studentId || "").trim()
      })).filter(record => record.classId && record.studentId) : []
    }
  };
}

async function importBackupPdf(file, school, classes) {
  const text = await file.text();
  const chunks = [...text.matchAll(/SKULGO_DATA:([A-Za-z0-9+/=]+)/g)].map(match => match[1]);
  if (!chunks.length) throw new Error("This PDF does not contain a SkulGo backup.");

  const pkg = normalizeBackupPayload(decodeBackupPayload(chunks.join("")));
  if (pkg.skulgoTransfer !== "v1" || pkg.backupType !== "CLASS") {
    throw new Error("This is not a supported SkulGo backup.");
  }
  if (pkg.school.schoolId !== school.schoolId) {
    throw new Error("School ID does not match this school.");
  }

  const classItem = classes.find(c => c.classId === pkg.class.classId);
  if (!classItem) throw new Error("Class ID is not registered in this school.");

  for (const student of pkg.students) {
    if (student.classId !== classItem.classId) {
      throw new Error("Backup contains a student assigned to the wrong class.");
    }
  }
  for (const subject of pkg.subjects) {
    if (subject.classId !== classItem.classId) {
      throw new Error("Backup contains a subject assigned to the wrong class.");
    }
  }
  for (const assignment of pkg.assignments) {
    if (assignment.classId !== classItem.classId) {
      throw new Error("Backup contains an assignment assigned to the wrong class.");
    }
  }
  for (const record of [...pkg.records.attendance, ...pkg.records.results]) {
    if (record.classId !== classItem.classId) {
      throw new Error("Backup contains a record assigned to the wrong class.");
    }
    if (!pkg.students.some(student => student.studentId === record.studentId)) {
      throw new Error("Backup contains a record for an unknown student.");
    }
  }

  const store = loadStore();
  const existingStudents = new Map(store.students.map(student => [student.studentId, student]));
  for (const incoming of pkg.students) {
    const existing = existingStudents.get(incoming.studentId);
    if (existing && existing.classId && existing.classId !== classItem.classId) {
      throw new Error("Student ID " + incoming.studentId + " already belongs to another class.");
    }
    existingStudents.set(incoming.studentId, {
      ...(existing || {}),
      ...incoming,
      schoolId: school.schoolId,
      classId: classItem.classId
    });
  }
  const admissionsById = new Map(store.admissions.map(admission => [admission.studentId || admission.admissionNumber, admission]));
  for (const student of existingStudents.values()) {
    if (student.schoolId === school.schoolId && student.classId === classItem.classId) {
      const admission = admissionsById.get(student.studentId);
      if (admission) admissionsById.set(student.studentId, { ...admission, ...student });
    }
  }
  await saveStore({ admissions: [...admissionsById.values()], students: [...existingStudents.values()] });

  const existingSubjects = new Map(loadSubjects().map(subject => [subject.subjectId, subject]));
  for (const incoming of pkg.subjects) {
    const existing = existingSubjects.get(incoming.subjectId);
    if (existing && existing.classId && existing.classId !== classItem.classId) {
      throw new Error("Subject ID " + incoming.subjectId + " already belongs to another class.");
    }
    existingSubjects.set(incoming.subjectId, { ...(existing || {}), ...incoming, schoolId: school.schoolId, classId: classItem.classId });
  }
  saveSubjects([...existingSubjects.values()]);

  const existingAssignments = new Map(loadAssignments().map(assignment => [
    assignment.assignmentId || assignment.id || [assignment.teacherId, assignment.classId, assignment.subjectId, assignment.assignmentType].join("|"),
    assignment
  ]));
  for (const incoming of pkg.assignments) {
    const key = incoming.assignmentId || [incoming.teacherId, incoming.classId, incoming.subjectId, incoming.assignmentType].join("|");
    existingAssignments.set(key, { ...(existingAssignments.get(key) || {}), ...incoming, schoolId: school.schoolId, classId: classItem.classId });
  }
  saveAssignments([...existingAssignments.values()]);

  const existingAttendance = loadAttendance();
  const attendanceMap = new Map(existingAttendance.map(record => [
    record.attendanceId || record.id || [record.classId, record.studentId, record.date].join("|"),
    record
  ]));
  pkg.records.attendance.forEach(record => {
    const key = record.attendanceId || record.id || [record.classId, record.studentId, record.date].join("|");
    attendanceMap.set(key, { ...attendanceMap.get(key), ...record, schoolId: school.schoolId });
  });
  saveAttendance([...attendanceMap.values()]);

  const existingResults = loadResultsRecords();
  const resultsMap = new Map(existingResults.map(record => [
    record.resultId || [record.studentId, record.subjectId, record.sessionId, record.termId].join("|"),
    record
  ]));
  pkg.records.results.forEach(record => {
    const key = record.resultId || [record.studentId, record.subjectId, record.sessionId, record.termId].join("|");
    resultsMap.set(key, { ...resultsMap.get(key), ...record, schoolId: school.schoolId });
  });
  writeStorage(RESULTS_STORAGE_KEY, JSON.stringify([...resultsMap.values()]));

  return pkg;
}

function renderTransfer() {
  const school = loadSchool();
  if (!school?.schoolId) {
    page.innerHTML = '<h2>Backup</h2><p class="muted">Set up the school first.</p>';
    return;
  }

  const classes = loadClasses().filter(c => c.schoolId === school.schoolId);
  const subjects = loadSubjects().filter(s => s.schoolId === school.schoolId && s.status === "ACTIVE");
  const assignments = loadAssignments().filter(a => a.schoolId === school.schoolId && a.status === "ACTIVE");
  const students = loadStore().students.filter(s => s.schoolId === school.schoolId);

  page.innerHTML =
    '<div class="section-heading"><div><h2>Backup</h2><p class="muted">Export a class backup as PDF, or import a SkulGo backup PDF from this device. Imported data is normalized and merged safely.</p></div></div>' +
    '<div class="cards">' +
      '<div class="card"><h3>Export Backup</h3><p>Choose a class and create its PDF backup. You can then share the file using WhatsApp, Gmail, Bluetooth, USB or any other option available on your device.</p>' +
      '<form id="export-backup-form" class="form-card"><div class="form-grid"><label>Class<select name="classId" required><option value="">Select class</option>' +
      classes.map(c => '<option value="' + escapeHtml(c.classId) + '">' + escapeHtml(c.name) + '</option>').join("") +
      '</select></label></div><div class="form-actions"><button class="primary-button">Export Backup</button></div><p class="form-message" id="export-message"></p></form></div>' +
      '<div class="card"><h3>Import Backup</h3><p>Pick a SkulGo backup PDF from your device. SkulGo normalizes the data, validates identities, and merges it without deleting unrelated records.</p>' +
      '<input type="file" id="import-backup-file" accept="application/pdf,.pdf">' +
      '<div class="form-actions"><button type="button" class="primary-button" id="import-backup">Import Backup</button></div><p class="form-message" id="import-message"></p></div>' +
    '</div>';

  document.querySelector("#export-backup-form").onsubmit = (e) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const classItem = classes.find(c => c.classId === String(d.get("classId")));
    const message = document.querySelector("#export-message");
    if (!classItem) return;

    const classStudents = students.filter(s => s.classId === classItem.classId);
    const classSubjects = subjects.filter(s => s.classId === classItem.classId);
    const classAssignments = assignments.filter(a => a.classId === classItem.classId);
    const attendance = loadAttendance().filter(r => r.classId === classItem.classId);
    const results = loadResultsRecords().filter(r => r.classId === classItem.classId);

    const pdf = createBackupPdf(
      school,
      classItem,
      classStudents,
      classSubjects,
      classAssignments,
      attendance,
      results,
      {
        skulgoTransfer: "v1",
        backupType: "CLASS",
        exportedAt: new Date().toISOString(),
        school: { schoolId: school.schoolId, name: school.name, session: school.session, term: school.term },
        class: { classId: classItem.classId, name: classItem.name, sectionId: classItem.sectionId || null },
        students: classStudents.map(s => ({
          ...s,
          schoolId: school.schoolId,
          studentId: s.studentId,
          name: s.name,
          gender: s.gender || s.sex || "",
          status: s.status || "ACTIVE",
          classId: s.classId
        })),
        subjects: classSubjects.map(s => ({
          subjectId: s.subjectId,
          name: s.name,
          classId: s.classId,
          status: s.status || "ACTIVE",
          studentIds: Array.isArray(s.studentIds) ? s.studentIds : []
        })),
        assignments: classAssignments.map(a => ({
          assignmentId: a.assignmentId || a.id || null,
          teacherId: a.teacherId || null,
          assignmentType: a.assignmentType || null,
          subjectId: a.subjectId || null,
          classId: a.classId
        })),
        records: {
          attendance,
          results
        }
      }
    );

    const filename = "skulgo-" + classItem.name.replace(/[^a-z0-9]+/gi, "-") + "-backup.pdf";
    downloadBackupPdf(filename, pdf);
    message.textContent = "PDF backup created on this device.";
  };

  const teacherInput = document.createElement("input");
  teacherInput.type = "file";
  teacherInput.id = "import-teacher-file";
  teacherInput.accept = ".json,application/json";
  const teacherButton = document.createElement("button");
  teacherButton.type = "button";
  teacherButton.className = "primary-button";
  teacherButton.id = "import-teacher";
  teacherButton.textContent = "Import Teacher Submission";
  const teacherMessage = document.createElement("p");
  teacherMessage.className = "form-message";
  teacherMessage.id = "teacher-import-message";
  const importCard = document.createElement("div");
  importCard.className = "card";
  importCard.innerHTML = '<h3>Teacher Submission</h3><p>Import a Teacher's completed subject records. SkulGo validates the school, class, teacher, subject and student identities, then merges results without duplicating existing records.</p>';
  importCard.append(teacherInput, document.createElement("div"), teacherMessage);
  importCard.querySelector("div").appendChild(teacherButton);
  document.querySelector(".cards").appendChild(importCard);

  teacherButton.onclick = async () => {
    const message = document.querySelector("#teacher-import-message");
    const file = document.querySelector("#import-teacher-file")?.files?.[0];
    if (!file) { message.textContent = "Select a Teacher submission JSON first."; return; }
    try {
      const pkg = JSON.parse(await file.text());
      if (pkg?.skulgoTransfer !== "v1" || pkg.direction !== "TEACHER_TO_ADMIN") throw new Error("This is not a valid Teacher submission.");
      if (pkg.school?.schoolId !== school.schoolId) throw new Error("This submission belongs to another school.");
      if (!pkg.teacher?.teacherId) throw new Error("Teacher ID is missing.");
      const classId = String(pkg.class?.classId || "");
      const classItem = classes.find(c => c.classId === classId);
      if (!classItem) throw new Error("The submitted class is not registered in this Admin school.");
      const teacher = assignments.find(a => a.teacherId === pkg.teacher.teacherId && a.classId === classId && a.status === "ACTIVE");
      if (!teacher) throw new Error("This Teacher is not assigned to the submitted class.");
      const packageSubjects = Array.isArray(pkg.subjects) ? pkg.subjects : [];
      const validSubjects = new Set(subjects.filter(s => s.classId === classId).map(s => s.subjectId));
      const invalidSubject = packageSubjects.find(s => !validSubjects.has(String(s.subjectId)));
      if (invalidSubject) throw new Error("The submission contains a subject not registered for this class.");
      const classStudentIds = new Set(students.filter(s => s.classId === classId).map(s => s.studentId));
      const incomingResults = Array.isArray(pkg.records?.results) ? pkg.records.results : [];
      const invalidStudent = incomingResults.find(r => !classStudentIds.has(String(r.studentId)));
      if (invalidStudent) throw new Error("The submission contains a student not registered in this class.");

      const current = loadResultsRecords();
      const key = (r) => [r.schoolId, r.classId, r.subjectId, r.studentId, r.sessionId, r.termId].join("|");
      const merged = new Map(current.map(r => [key(r), r]));
      for (const incoming of incomingResults) {
        const normalized = {
          ...(merged.get(key({
            schoolId: school.schoolId,
            classId,
            subjectId: incoming.subjectId,
            studentId: incoming.studentId,
            sessionId: incoming.sessionId || school.session?.sessionId || school.session?.name || "",
            termId: incoming.termId || school.term?.termId || school.term?.name || ""
          }) ) || {}),
          ...incoming,
          resultId: merged.get(key(incoming))?.resultId || id("result"),
          schoolId: school.schoolId,
          classId,
          sessionId: incoming.sessionId || school.session?.sessionId || school.session?.name || "",
          termId: incoming.termId || school.term?.termId || school.term?.name || ""
        };
        if (incoming.ca !== undefined) {
          normalized.ca = Number(incoming.ca);
          normalized.caMaximum = Number(incoming.caMaximum || normalized.caMaximum || 20);
        }
        if (incoming.exam !== undefined) {
          normalized.exam = Number(incoming.exam);
          normalized.examMaximum = Number(incoming.examMaximum || normalized.examMaximum || 60);
        }
        merged.set(key(normalized), normalized);
      }
      writeStorage(RESULTS_STORAGE_KEY, JSON.stringify([...merged.values()]));
      message.textContent = "Teacher submission imported and merged safely.";
      renderTransfer();
    } catch (error) {
      message.textContent = error?.message || "Could not import Teacher submission.";
    }
  };

  document.querySelector("#import-backup").onclick = async () => {
    const message = document.querySelector("#import-message");
    const input = document.querySelector("#import-backup-file");
    const file = input?.files?.[0];
    if (!file) {
      message.textContent = "Select a backup PDF first.";
      return;
    }
    try {
      const pkg = await importBackupPdf(file, school, classes);
      message.textContent = "Backup imported, normalized and merged safely for " + pkg.class.name + ".";
    } catch (error) {
      message.textContent = error?.message || "Could not import backup.";
    }
  };
}
function renderSettings() {
  page.innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Settings</h2>
        <p class="muted">Manage school setup and device data.</p>
      </div>
    </div>
    <div class="cards">
      <div class="card">
        <h3>School Setup</h3>
        <p>Update the school's identity, sections, academic session and current term.</p>
        <button class="primary-button" id="settings-edit-school" type="button">Edit School Setup</button>
      </div>
      <div class="card">
        <h3>Remark Bands</h3>
        <p>Set the remark that should appear for each performance grade. Changes are saved on this device.</p>
        <form id="remark-bands-form">
          <div class="report-card-remarks-grid">${loadRemarkBands().bands.map((band, index) => `<label>Level ${escapeHtml(band.label)} — ${escapeHtml(band.title || '')}
                <input type="number" min="0" max="100" step="0.01" name="minimum-${index}" value="${escapeHtml(band.minimumAverage ?? '')}" placeholder="Minimum average">
              </label>
              <label>Default remark
                <input name="remark-${index}" value="${escapeHtml(band.remark || '')}" placeholder="Custom remark">
              </label>`).join('')}</div>
          <div class="form-actions"><button class="primary-button" type="submit">Save Remark Bands</button></div>
        </form>
      </div>
      <div class="card">
        <h3>Start Fresh</h3>
        <p>Remove SkulGo school data stored on this device and clear local safety snapshots. The application itself will not be deleted.</p>
        <button class="secondary-button" id="settings-reset-app" type="button">Start Fresh</button>
      </div>
    </div>`;

  document.querySelector("#remark-bands-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const current = loadRemarkBands().bands;
    const next = current.map((band, index) => ({
      ...band,
      minimumAverage: Number(data.get(`minimum-${index}`)),
      remark: String(data.get(`remark-${index}`) || "").trim()
    })).sort((a,b) => Number(b.minimumAverage) - Number(a.minimumAverage));
    saveRemarkBands(next);
    event.currentTarget.insertAdjacentHTML("afterbegin", '<div class="notice"><strong>Remark bands saved successfully.</strong></div>');
  });

  document.querySelector("#settings-edit-school").addEventListener("click", async () => {
    nav.forEach((item) => item.classList.remove("active"));
    document.querySelector('[data-section="school"]').classList.add("active");
    await renderSchool();
    document.querySelector("#edit-school")?.click();
  });

  document.querySelector("#settings-reset-app").addEventListener("click", async () => {
    const confirmed = window.confirm("Start fresh? This will remove SkulGo school data stored on this device and clear the app's local safety snapshots. The application itself will not be deleted.");
    if (!confirmed) return;
    try {
      const keepKeys = new Set(["skulgo.app.role.v1"]);
      Object.keys(localStorage).forEach((key) => { if (!keepKeys.has(key)) localStorage.removeItem(key); });
      Object.keys(sessionStorage).forEach((key) => sessionStorage.removeItem(key));
      studentStoreCache = null;
      classStoreCache = null;
      subjectStoreCache = null;
      teacherStoreCache = null;
      assignmentStoreCache = null;
      try { indexedDB.deleteDatabase("skulgo-safe-data"); } catch {}
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("skulgo-")).map((key) => caches.delete(key)));
      }
      window.location.href = "../";
    } catch (error) {
      window.alert("Could not complete the reset. Please try again.");
      console.warn("SkulGo fresh-start reset failed", error);
    }
  });
}

function render(section) {
  const [heading] = labels[section] || [section, section];
  title.textContent = heading;

  if (section === "school") {
    renderSchool();
  } else if (section === "students") {
    renderStudents();
  } else if (section === "classes") {
    renderClasses();
  } else if (section === "subjects") {
    renderSubjects();
  } else if (section === "teachers") {
    renderTeachers();
  } else if (section === "assignments") {
    renderAssignments();
  } else if (section === "attendance") {
    renderAttendance();
  } else if (section === "results") {
    renderResults();
  } else if (section === "report-card") {
    renderReportCard();
  } else if (section === "grade-band") {
    renderGradeBand();
  } else if (section === "transfer") {
    renderTransfer();
  } else if (section === "settings") {
    renderSettings();
  } else {
    page.innerHTML = `<h2>${heading}</h2><p class="muted">This module is not wired into the Admin shell yet.</p>`;
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





















/* ADMIN TEACHER-STYLE SUBJECT WORKSPACE */
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

  window.renderAdminSubjects = function () {
    subjectWorkspace(false);
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

  function subjectWorkspace(on) {
    page.classList.toggle("admin-subject-workspace", !!on);
  }

  (function installTeacherSubjectStyle() {
    if (document.getElementById("admin-teacher-subject-style")) return;
    const style = document.createElement("style");
    style.id = "admin-teacher-subject-style";
    style.textContent = `
      #page.admin-subject-workspace {
        max-width: 1100px;
        margin: 28px auto;
        padding: 0 24px 40px;
        background: transparent;
        border: 0;
        border-radius: 0;
      }
      #page.admin-subject-workspace .section-heading {
        display:flex; justify-content:space-between; align-items:flex-start;
        gap:20px; margin-bottom:18px;
      }
      #page.admin-subject-workspace .section-heading h2,
      #page.admin-subject-workspace .section-heading h3 { margin:0; }
      #page.admin-subject-workspace .muted { color:#68758a; }
      #page.admin-subject-workspace .card,
      #page.admin-subject-workspace .form-card {
        background:#fff; border:1px solid #e3e8ef; border-radius:14px;
        padding:20px; margin-bottom:18px;
      }
      #page.admin-subject-workspace .card h3 { margin:0 0 5px; }
      #page.admin-subject-workspace .card p { margin:4px 0; color:#68758a; }
      #page.admin-subject-workspace .card-action { margin-top:14px; }
      #page.admin-subject-workspace .primary-button,
      #page.admin-subject-workspace .small-button {
        border:0; border-radius:8px; padding:10px 14px; cursor:pointer; font:inherit;
      }
      #page.admin-subject-workspace .primary-button { background:#172033; color:#fff; }
      #page.admin-subject-workspace .small-button { background:#eef2f7; color:#172033; }
      #page.admin-subject-workspace .student-results { margin-top:16px; border-top:1px solid #edf0f4; }
      #page.admin-subject-workspace .student-result-row {
        display:grid;
        grid-template-columns:minmax(220px,1fr) repeat(3,minmax(90px,120px)) minmax(70px,90px);
        align-items:center; gap:12px; padding:15px 0; border-bottom:1px solid #edf0f4;
      }
      #page.admin-subject-workspace .student-result-row:last-child { border-bottom:0; }
      #page.admin-subject-workspace .student-result-main { min-width:0; display:grid; gap:3px;  }
      #page.admin-subject-workspace .student-id { font-size:12px; color:#68758a; }
      #page.admin-subject-workspace .result-number,
      #page.admin-subject-workspace .result-grade { display:grid; gap:2px; text-align:center; }
      #page.admin-subject-workspace .result-label {
        font-size:11px; color:#68758a; font-weight:700; letter-spacing:.04em;
      }
      #page.admin-subject-workspace .result-number strong,
      #page.admin-subject-workspace .result-grade strong { font-size:18px; }
      #page.admin-subject-workspace .result-number small { font-size:11px; color:#68758a; }
      #page.admin-subject-workspace .result-number.total strong,
      #page.admin-subject-workspace .result-grade strong { font-size:20px; }
      #page.admin-subject-workspace .student-row {
        display:flex; align-items:center; justify-content:space-between;
        gap:12px; padding:12px 0; border-bottom:1px solid #edf0f4;
      }
      #page.admin-subject-workspace .student-row:last-child { border-bottom:0; }
      #page.admin-subject-workspace .empty { text-align:center; padding:35px; color:#68758a; }
      #page.admin-subject-workspace .form-grid {
        display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px;
      }
      #page.admin-subject-workspace .form-grid label { display:grid; gap:7px; font-size:13px; font-weight:600; }
      #page.admin-subject-workspace .form-grid input,
      #page.admin-subject-workspace .form-grid select {
        width:100%; border:1px solid #ccd4df; border-radius:8px;
        padding:11px 12px; background:#fff; font:inherit;
      }
      #page.admin-subject-workspace .form-actions { margin-top:18px; }
      #page.admin-subject-workspace .score-row {
        display:grid; grid-template-columns:minmax(0,1fr) 150px;
        align-items:center; gap:16px; padding:14px 0; border-bottom:1px solid #edf0f4;
      }
      #page.admin-subject-workspace .score-student { display:grid; gap:3px; }
      #page.admin-subject-workspace .score-input {
        display:block!important; min-height:44px!important; visibility:visible!important;
        opacity:1!important; color:#172033!important; background:#fff!important;
        border:1px solid #8b98aa!important; border-radius:8px; padding:11px 12px; font:inherit;
      }
      @media(max-width:900px) {
        #page.admin-subject-workspace .student-result-row {
          grid-template-columns:minmax(180px,1fr) repeat(4,minmax(65px,1fr)); gap:8px;
        }
      }
      @media(max-width:650px) {
        #page.admin-subject-workspace { margin:20px auto; padding:0 16px 32px; }
        #page.admin-subject-workspace .student-result-row { grid-template-columns:1fr 1fr 1fr 1fr 1fr; }
        
        #page.admin-subject-workspace .result-number,
        #page.admin-subject-workspace .result-grade { padding:8px 4px; background:#f7f9fc; border-radius:8px; }
        #page.admin-subject-workspace .form-grid { grid-template-columns:1fr; }
        #page.admin-subject-workspace .score-row { grid-template-columns:1fr; }
      }
    `;
    document.head.appendChild(style);
  })();

  function renderAdminSubject(subjectId, classId) {
    subjectWorkspace(true);
    const school = loadSchool(), subject = loadSubjects().find(x => x.schoolId === school?.schoolId && x.subjectId === subjectId), cls = loadClasses().find(x => x.schoolId === school?.schoolId && x.classId === classId);
    if (!school || !subject || !cls) return renderSubjects();
    const students = studentsFor(school, classId), records = recordsFor(school, classId, subjectId), assessments = caDefs(school, classId, subjectId), exam = examDef(school, classId, subjectId), scale = loadGradeScale();
    const caMax = assessments.reduce((sum, a) => sum + Number(a.maximumScore || 0), 0);
    const examMax = exam ? Number(exam.maximumScore || 0) : 0;
    page.innerHTML = `
      <div class="section-heading"><div><h2>${esc(subject.name)}</h2><p class="muted">${esc(cls.name)} · ${students.length} students</p></div><button class="small-button" id="admin-subject-back">Back</button></div>
      <div class="card"><h3>Subject role</h3><p>Subject Teacher — CA, exams and results for assigned students.</p><div class="card-action"><button class="primary-button" id="admin-add-ca">+ Add CA</button> <button class="primary-button" id="admin-open-exam">${exam ? "Open Exam" : "+ Add Exam"}</button></div></div>
      <div class="card"><h3>Students</h3><p class="muted">CA is calculated from every CA added for this subject. Add CA1, CA2, CA3, CA4 or more — the CA total updates automatically.</p>
      ${students.length ? '<div class="student-results">'+students.map(st => {
        const r = records.find(x => x.studentId === st.studentId);
        const ca = r ? (r.caAssessments || []).reduce((n,a) => n + Number(a.score || 0), 0) : 0;
        const examEntered = r && r.exam !== undefined && r.exam !== null;
        const examScore = examEntered ? Number(r.exam) : null;
        const total = ca + (examEntered ? examScore : 0);
        const overallMax = caMax + examMax;
        const grade = !examEntered ? "—" : overallMax > 0 ? calculateResultGrade(total, scale) : "—";
        return '<div class="student-result-row"><div class="student-result-main"><strong>'+esc(st.name)+'</strong><div class="student-id">'+esc(st.studentId||"")+' · '+esc(st.sex||st.gender||"")+' · '+esc(st.status||"ACTIVE")+'</div></div><div class="result-number"><span class="result-label">CA</span><strong>'+ca+'</strong><small>/ '+caMax+'</small></div><div class="result-number"><span class="result-label">EXAM</span><strong>'+(examEntered?examScore:"—")+'</strong><small>'+ (examEntered?"/ "+examMax:"/ —") +'</small></div><div class="result-number total"><span class="result-label">TOTAL</span><strong>'+total+'</strong><small>/ '+overallMax+'</small></div><div class="result-grade"><span class="result-label">GRADE</span><strong>'+grade+'</strong></div></div>';
      }).join("")+'</div>' : '<div class="empty">No students assigned to this subject.</div>'}
      </div>
      <div class="card"><h3>CA assessments</h3>
      ${assessments.length ? assessments.map(a => '<div class="student-row"><div><strong>'+esc(a.name)+'</strong><div class="student-id">Maximum score: '+esc(a.maximumScore)+' · '+records.filter(r=>(r.caAssessments||[]).some(x=>x.name===a.name)).length+' scores</div></div><button class="small-button" data-admin-ca="'+esc(a.id)+'">Open</button></div>').join("") : '<div class="empty">No CA assessment yet.</div>'}
      ${exam ? '<div class="student-row"><div><strong>'+esc(exam.name||"EXAM")+'</strong><div class="student-id">Maximum score: '+esc(exam.maximumScore)+' · '+records.filter(r=>r.exam!==undefined).length+' scores</div></div><button class="small-button" id="admin-existing-exam">Open</button></div>' : '<div class="empty">No Exam yet.</div>'}
      </div>`;
    document.querySelector("#admin-subject-back").onclick = renderSubjects;
    document.querySelector("#admin-add-ca").onclick = () => renderAdminAddCA(subjectId, classId);
    document.querySelector("#admin-open-exam").onclick = () => exam ? renderAdminExam(subjectId, classId) : renderAdminAddExam(subjectId, classId);
    document.querySelector("#admin-existing-exam")?.addEventListener("click", () => renderAdminExam(subjectId, classId));
    document.querySelectorAll("[data-admin-ca]").forEach(b => b.onclick = () => renderAdminCA(b.dataset.adminCa, subjectId, classId));
  }

  function renderAdminAddCA(subjectId,classId) {
    subjectWorkspace(true);
    const school=loadSchool(), subject=loadSubjects().find(x=>x.subjectId===subjectId), cls=loadClasses().find(x=>x.classId===classId);
    if(!school||!subject||!cls)return renderSubjects();
    page.innerHTML=`<div class="section-heading"><div><h2>Add CA</h2><p class="muted">${esc(subject.name)} · ${esc(cls.name)}</p></div><button class="small-button" id="ca-back">Back</button></div><form class="form-card" id="ca-form"><div class="form-grid"><label>Assessment name<input name="name" placeholder="CA 1" required></label><label>Maximum score<input name="maximumScore" type="number" min="1" step="1" value="20" required></label><label>Date<input name="date" type="date" value="${new Date().toISOString().slice(0,10)}" required></label></div><div class="form-actions"><button class="primary-button">Create CA</button></div><p class="form-message" id="ca-message"></p></form>`;
    document.querySelector("#ca-back").onclick=()=>renderAdminSubject(subjectId,classId);
    document.querySelector("#ca-form").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),name=String(d.get("name")||"").trim(),maximumScore=Number(d.get("maximumScore")),date=String(d.get("date")||""),s=loadSchool(),c=context(s,classId,subjectId),msg=document.querySelector("#ca-message");if(!name||!Number.isFinite(maximumScore)||maximumScore<=0){msg.textContent="Assessment name and a valid maximum score are required.";return}if(caDefs(s,classId,subjectId).some(x=>x.name.toLowerCase()===name.toLowerCase())){msg.textContent="An assessment with this name already exists.";return}const a={id:id("ca"),key:c.key,kind:"ca",name,maximumScore,date};upsert(a);renderAdminCA(a.id,subjectId,classId)};
  }

  function renderAdminCA(assessmentId,subjectId,classId) {
    subjectWorkspace(true);
    const school=loadSchool(),subject=loadSubjects().find(x=>x.subjectId===subjectId),cls=loadClasses().find(x=>x.classId===classId);if(!school||!subject||!cls)return renderSubjects();
    const c=context(school,classId,subjectId),a=caDefs(school,classId,subjectId).find(x=>x.id===assessmentId);if(!a)return renderAdminSubject(subjectId,classId);
    const students=studentsFor(school,classId),all=loadResultsRecords(),scoreFor=studentId=>all.find(r=>r.schoolId===school.schoolId&&r.classId===classId&&r.subjectId===subjectId&&r.studentId===studentId&&String(r.sessionId||"")===String(c.sessionId)&&String(r.termId||"")===String(c.termId))?.caAssessments?.find(x=>x.name===a.name)?.score;
    page.innerHTML=`<div class="section-heading"><div><h2>${esc(a.name)}</h2><p class="muted">${esc(subject.name)} · ${esc(cls.name)} · Max ${esc(a.maximumScore)} · ${esc(a.date)}</p></div><button class="small-button" id="ca-detail-back">Back</button></div><div class="card"><h3>CA details</h3><p>These details belong to this CA record. Edit them here when correction is needed.</p><div class="card-action"><button class="small-button" id="edit-ca">Edit CA details</button></div></div><form class="form-card" id="ca-scores"><h3>Edit student scores</h3>${students.length?students.map(st=>'<div class="score-row"><div class="score-student"><strong>'+esc(st.name)+'</strong><span class="student-id">'+esc(st.studentId||"")+'</span></div><input class="score-input" name="score-'+esc(st.studentId)+'" type="number" min="0" max="'+esc(a.maximumScore)+'" step="0.01" value="'+esc(scoreFor(st.studentId)??"")+'" placeholder="0 - '+esc(a.maximumScore)+'"></div>').join(""):'<p class="empty">No students assigned to this subject.</p>'}<div class="form-actions"><button class="primary-button">Save Corrections</button></div><p class="form-message" id="ca-score-message"></p></form>`;
    document.querySelector("#ca-detail-back").onclick=()=>renderAdminSubject(subjectId,classId);
    document.querySelector("#edit-ca").onclick=()=>renderAdminEditCA(a.id,subjectId,classId);
    document.querySelector("#ca-scores").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),msg=document.querySelector("#ca-score-message"),all=loadResultsRecords(),map=new Map(all.filter(r=>r.schoolId===school.schoolId&&r.classId===classId&&r.subjectId===subjectId&&String(r.sessionId||"")===String(c.sessionId)&&String(r.termId||"")===String(c.termId)).map(r=>[r.studentId,r]));for(const st of students){const raw=d.get("score-"+st.studentId);if(raw===null||String(raw).trim()==="")continue;const score=Number(raw);if(!Number.isFinite(score)||score<0||score>a.maximumScore){msg.textContent="Each score must be between 0 and the assessment maximum.";return}const old=map.get(st.studentId)||{},next=(old.caAssessments||[]).filter(x=>x.name!==a.name);next.push({name:a.name,score,maximumScore:Number(a.maximumScore),date:a.date});map.set(st.studentId,{...old,resultId:old.resultId||id("result"),schoolId:school.schoolId,classId,subjectId,studentId:st.studentId,sessionId:c.sessionId,termId:c.termId,caAssessments:next,ca:next.reduce((n,x)=>n+Number(x.score||0),0),caName:next.map(x=>x.name).join(", "),caMaximum:next.reduce((n,x)=>n+Number(x.maximumScore||0),0),caDate:a.date})}const untouched=all.filter(r=>!(r.schoolId===school.schoolId&&r.classId===classId&&r.subjectId===subjectId&&String(r.sessionId||"")===String(c.sessionId)&&String(r.termId||"")===String(c.termId)));writeStorage(RESULTS_STORAGE_KEY,JSON.stringify([...untouched,...map.values()]));renderAdminSubject(subjectId,classId)};
  }

  function renderAdminEditCA(idValue,subjectId,classId) {
    subjectWorkspace(true);
    const school=loadSchool(),a=caDefs(school,classId,subjectId).find(x=>x.id===idValue);if(!school||!a)return renderAdminSubject(subjectId,classId);
    page.innerHTML=`<div class="section-heading"><div><h2>Edit CA details</h2><p class="muted">Correct the existing assessment without creating another CA.</p></div><button class="small-button" id="edit-ca-back">Back</button></div><form class="form-card" id="edit-ca-form"><div class="form-grid"><label>Assessment name<input name="name" value="${esc(a.name)}" required></label><label>Maximum score<input name="maximumScore" type="number" min="1" step="1" value="${esc(a.maximumScore)}" required></label><label>Date<input name="date" type="date" value="${esc(a.date)}" required></label></div><div class="form-actions"><button class="primary-button">Save CA details</button></div><p class="form-message" id="edit-ca-message"></p></form>`;
    document.querySelector("#edit-ca-back").onclick=()=>renderAdminCA(a.id,subjectId,classId);
    document.querySelector("#edit-ca-form").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),name=String(d.get("name")||"").trim(),maximumScore=Number(d.get("maximumScore")),date=String(d.get("date")||""),msg=document.querySelector("#edit-ca-message");if(!name||!Number.isFinite(maximumScore)||maximumScore<=0){msg.textContent="Assessment name and a valid maximum score are required.";return}const all=defs(),i=all.findIndex(x=>x.id===a.id);if(i>=0)all[i]={...all[i],name,maximumScore,date};saveDefs(all);const updated=loadResultsRecords().map(r=>{if(r.schoolId!==school.schoolId||r.classId!==classId||r.subjectId!==subjectId)return r;const next=(r.caAssessments||[]).map(x=>x.name===a.name?{...x,name,maximumScore,date}:x);return {...r,caAssessments:next,ca:next.reduce((n,x)=>n+Number(x.score||0),0),caName:next.map(x=>x.name).join(", "),caMaximum:next.reduce((n,x)=>n+Number(x.maximumScore||0),0),caDate:date}});writeStorage(RESULTS_STORAGE_KEY,JSON.stringify(updated));renderAdminCA(a.id,subjectId,classId)};
  }

  function renderAdminAddExam(subjectId,classId) {
    subjectWorkspace(true);
    const school=loadSchool(),subject=loadSubjects().find(x=>x.subjectId===subjectId),cls=loadClasses().find(x=>x.classId===classId);if(!school||!subject||!cls)return renderSubjects();
    page.innerHTML=`<div class="section-heading"><div><h2>Add Exam</h2><p class="muted">${esc(subject.name)} · ${esc(cls.name)}</p></div><button class="small-button" id="exam-back">Back</button></div><form class="form-card" id="exam-form"><div class="form-grid"><label>Exam name<input name="name" value="EXAM" required></label><label>Maximum score<input name="maximumScore" type="number" min="1" step="1" value="60" required></label><label>Date<input name="date" type="date" value="${new Date().toISOString().slice(0,10)}" required></label></div><div class="form-actions"><button class="primary-button">Create Exam &amp; Add Scores</button></div><p class="form-message" id="exam-message"></p></form>`;
    document.querySelector("#exam-back").onclick=()=>renderAdminSubject(subjectId,classId);
    document.querySelector("#exam-form").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),school=loadSchool(),c=context(school,classId,subjectId),maximumScore=Number(d.get("maximumScore")),date=String(d.get("date")||""),existing=examDef(school,classId,subjectId),msg=document.querySelector("#exam-message");if(!Number.isFinite(maximumScore)||maximumScore<=0){msg.textContent="Maximum score must be greater than zero.";return}if(existing)return renderAdminExam(subjectId,classId);const a={id:id("exam"),key:c.key,kind:"exam",name:"EXAM",maximumScore,date};upsert(a);renderAdminExam(subjectId,classId)};
  }

  function renderAdminExam(subjectId,classId) {
    subjectWorkspace(true);
    const school=loadSchool(),subject=loadSubjects().find(x=>x.subjectId===subjectId),cls=loadClasses().find(x=>x.classId===classId),exam=school&&examDef(school,classId,subjectId);if(!school||!subject||!cls)return renderSubjects();if(!exam)return renderAdminAddExam(subjectId,classId);
    const c=context(school,classId,subjectId),students=studentsFor(school,classId),all=loadResultsRecords(),scoreFor=idValue=>all.find(r=>r.schoolId===school.schoolId&&r.classId===classId&&r.subjectId===subjectId&&r.studentId===idValue&&String(r.sessionId||"")===String(c.sessionId)&&String(r.termId||"")===String(c.termId))?.exam;
    page.innerHTML=`<div class="section-heading"><div><h2>EXAM</h2><p class="muted">${esc(subject.name)} · ${esc(cls.name)} · Max ${esc(exam.maximumScore)} · ${esc(exam.date)}</p></div><button class="small-button" id="exam-detail-back">Back</button></div><div class="card"><h3>Exam</h3><p>This is the single exam record for this subject. Enter one score for each student.</p></div><form class="form-card" id="exam-scores"><h3>Enter exam scores</h3>${students.length?students.map(st=>'<div class="score-row"><div class="score-student"><strong>'+esc(st.name)+'</strong><span class="student-id">'+esc(st.studentId||"")+'</span></div><input class="score-input" name="score-'+esc(st.studentId)+'" type="number" min="0" max="'+esc(exam.maximumScore)+'" step="0.01" value="'+esc(scoreFor(st.studentId)??"")+'" placeholder="0 - '+esc(exam.maximumScore)+'"></div>').join(""):'<p class="empty">No students assigned to this subject.</p>'}<div class="form-actions"><button class="primary-button">Save Exam Scores</button></div><p class="form-message" id="exam-score-message"></p></form>`;
    document.querySelector("#exam-detail-back").onclick=()=>renderAdminSubject(subjectId,classId);
    document.querySelector("#exam-scores").onsubmit=e=>{e.preventDefault();const d=new FormData(e.currentTarget),msg=document.querySelector("#exam-score-message"),all=loadResultsRecords(),map=new Map(all.filter(r=>r.schoolId===school.schoolId&&r.classId===classId&&r.subjectId===subjectId&&String(r.sessionId||"")===String(c.sessionId)&&String(r.termId||"")===String(c.termId)).map(r=>[r.studentId,r]));for(const st of students){const raw=d.get("score-"+st.studentId);if(raw===null||String(raw).trim()==="")continue;const score=Number(raw);if(!Number.isFinite(score)||score<0||score>exam.maximumScore){msg.textContent="Each score must be between 0 and the exam maximum.";return}const old=map.get(st.studentId)||{};map.set(st.studentId,{...old,resultId:old.resultId||id("result"),schoolId:school.schoolId,classId,subjectId,studentId:st.studentId,sessionId:c.sessionId,termId:c.termId,exam:score,examName:exam.name||"EXAM",examMaximum:Number(exam.maximumScore),examDate:exam.date})}const untouched=all.filter(r=>!(r.schoolId===school.schoolId&&r.classId===classId&&r.subjectId===subjectId&&String(r.sessionId||"")===String(c.sessionId)&&String(r.termId||"")===String(c.termId)));writeStorage(RESULTS_STORAGE_KEY,JSON.stringify([...untouched,...map.values()]));renderAdminSubject(subjectId,classId)};
  }

  window.renderAdminSubject = renderAdminSubject;

  // Ensure the Admin Subjects navigation opens this Teacher-style workspace.
  // app.js has its own Subjects renderer, so keep this listener explicit.
  const subjectsNav = document.querySelector('[data-section="subjects"]');
  if (subjectsNav && !subjectsNav.dataset.adminSubjectWorkspaceBound) {
    subjectsNav.dataset.adminSubjectWorkspaceBound = "1";
    subjectsNav.addEventListener("click", () => window.renderAdminSubjects());
  }
