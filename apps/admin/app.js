const labels = {
  school: ["School", "School setup"],
  students: ["Students", "Students"],
  classes: ["Classes", "Classes"],
  subjects: ["Subjects", "Subjects"],
  teachers: ["Teachers", "Teachers"],
  attendance: ["Attendance", "Attendance"],
  results: ["Results", "Results"],
  "report-card": ["Report Card", "Report Card"],
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
  const serialized = JSON.stringify(school);
  writeStorage(SCHOOL_STORAGE_KEY, serialized);

  return fetch(SCHOOL_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: serialized,
    cache: "no-store"
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error("Local school store rejected the save.");
    }
    const saved = await response.json();
    writeStorage(SCHOOL_STORAGE_KEY, JSON.stringify(saved));
    return saved;
  }).catch((error) => {
    console.warn("Local school store save failed; browser storage remains available.", error);
    return school;
  });
}

async function hydrateSchoolStore() {
  try {
    const response = await fetch(SCHOOL_API_PATH, { cache: "no-store" });
    if (!response.ok) return false;

    const saved = await response.json();
    if (saved && typeof saved === "object" && saved.schoolId && saved.name) {
      writeStorage(SCHOOL_STORAGE_KEY, JSON.stringify(saved));
      return true;
    }

    const local = loadSchool();
    if (local && typeof local === "object" && local.schoolId && local.name) {
      await saveSchool(local);
      return true;
    }

    return false;
  } catch (error) {
    console.warn("Local school store unavailable; using browser storage.", error);
    return false;
  }
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
  const school = loadSchool();
  if (!school) {
    page.innerHTML = '<h2>Subjects</h2><p class="muted">Set up the school before creating subjects.</p>';
    return;
  }
  const subjects = loadSubjects().filter((item) => item.schoolId === school.schoolId);
  page.innerHTML = `
    <div class="section-heading">
      <div><h2>Subjects</h2><p class="muted">Manage the subjects offered by this school.</p></div>
      <button class="primary-button" id="new-subject">New subject</button>
    </div>
    <div id="subject-form"></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Subject</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="subject-rows"></tbody>
      </table>
    </div>`;

  document.querySelector("#subject-rows").innerHTML = subjects.length
    ? subjects.map((subject) => `<tr><td>${escapeHtml(subject.name)}</td><td>${subject.status === "ACTIVE" ? "Active" : "Disabled"}</td><td>${subject.status === "ACTIVE" ? `<button class="small-button" data-disable-subject="${escapeHtml(subject.subjectId)}">Disable</button>` : "â"}</td></tr>`).join("")
    : '<tr><td colspan="3" class="empty">No subjects yet.</td></tr>';

  document.querySelector("#new-subject").addEventListener("click", () => {
    document.querySelector("#subject-form").innerHTML = `
      <form class="form-card" id="subject-create-form">
        <div class="form-grid">
          <label>Subject name<input name="name" placeholder="Mathematics" required></label>
        </div>
        <div class="form-actions"><button class="primary-button" type="submit">Save subject</button></div>
      </form>`;
    document.querySelector("#subject-create-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = String(new FormData(event.currentTarget).get("name") || "").trim();
      if (!name) return;
      const next = loadSubjects();
      next.push({
        subjectId: id("subject"),
        schoolId: school.schoolId,
        name,
        status: "ACTIVE",
        createdAt: new Date().toISOString()
      });
      saveSubjects(next);
      renderSubjects();
    });
  });

  document.querySelectorAll("[data-disable-subject]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = loadSubjects();
      const subject = next.find((item) => item.subjectId === button.dataset.disableSubject && item.schoolId === school.schoolId);
      if (!subject) return;
      subject.status = "DISABLED";
      saveSubjects(next);
      renderSubjects();
    });
  });
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

  const className = (classId) => {
    const item = loadClasses().find((entry) => entry.schoolId === school.schoolId && entry.classId === classId);
    return item ? item.name : classId;
  };

  document.querySelector("#student-rows").innerHTML = students.length
    ? students.map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.admissionNumber || "â")}</td><td>${escapeHtml(className(s.classId) || "â")}</td><td>${escapeHtml(s.gender || "â")}</td></tr>`).join("")
    : '<tr><td colspan="4" class="empty">No students yet.</td></tr>';

  document.querySelector("#admission-rows").innerHTML = pending.length
    ? pending.map((a) => `<tr><td>${escapeHtml(a.applicantName)}</td><td>${escapeHtml(a.admissionNumber || "â")}</td><td>${escapeHtml(className(a.intendedClassId) || "â")}</td><td><button class="small-button" data-approve="${a.admissionId}">Approve</button></td></tr>`).join("")
    : '<tr><td colspan="4" class="empty">No pending admissions.</td></tr>';

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
        <div class="form-actions"><button class="primary-button" type="submit">Save admission</button></div>
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
      saveStore(next).then(() => renderStudents());
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
      <button class="primary-button" id="new-assignment">New assignment</button>
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
      renderAssignments();
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
    page.innerHTML = `
      <h2>Attendance</h2>
      <p class="muted">Complete School Setup before recording attendance.</p>
    `;
    return;
  }

  const classes = loadClasses().filter((item) => item.schoolId === school.schoolId);
  const today = new Date().toISOString().slice(0, 10);

  page.innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Attendance</h2>
        <p class="muted">Record daily student attendance by class.</p>
      </div>
    </div>

    <form class="form-card" id="attendance-selector">
      <div class="form-grid">
        <label>Class
          <select name="classId" required>
            <option value="">Select class</option>
            ${classes.map((item) => `<option value="${escapeHtml(item.classId)}">${escapeHtml(item.name)}</option>`).join("")}
          </select>
        </label>
        <label>Date
          <input type="date" name="date" value="${today}" required>
        </label>
      </div>
      <div class="form-actions">
        <button class="primary-button" type="submit">Load students</button>
      </div>
    </form>

    <div id="attendance-record-form"></div>
  `;

  document.querySelector("#attendance-selector").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    renderAttendanceList(
      school,
      String(data.get("classId") || ""),
      String(data.get("date") || today)
    );
  });
}

function renderAttendanceList(school, classId, date) {
  const selectedClass = loadClasses().find(
    (item) => item.schoolId === school.schoolId && item.classId === classId
  );
  const store = loadStore();
  const students = store.students.filter(
    (student) => student.schoolId === school.schoolId && student.classId === classId
  );
  const records = loadAttendance();
  const existing = new Map(
    records
      .filter((record) =>
        record.schoolId === school.schoolId &&
        record.classId === classId &&
        record.date === date
      )
      .map((record) => [record.studentId, record.status])
  );
  const container = document.querySelector("#attendance-record-form");
  if (!container) return;

  if (!selectedClass) {
    container.innerHTML = '<p class="empty">Select a valid class.</p>';
    return;
  }

  if (!students.length) {
    container.innerHTML = `
      <div class="form-card">
        <h3>${escapeHtml(selectedClass.name)}</h3>
        <p class="muted">No approved students are enrolled in this class.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="section-heading">
      <div>
        <h3>${escapeHtml(selectedClass.name)}</h3>
        <p class="muted">${escapeHtml(date)}</p>
      </div>
    </div>
    <form class="form-card" id="attendance-form">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Student</th><th>Admission number</th><th>Attendance</th></tr></thead>
          <tbody>
            ${students.map((student) => {
              const status = existing.get(student.studentId) || "present";
              return `<tr>
                <td>${escapeHtml(student.name)}</td>
                <td>${escapeHtml(student.admissionNumber || "N/A")}</td>
                <td>
                  <select name="status:${escapeHtml(student.studentId)}" required>
                    <option value="present" ${status === "present" ? "selected" : ""}>Present</option>
                    <option value="absent" ${status === "absent" ? "selected" : ""}>Absent</option>
                  </select>
                </td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div class="form-actions">
        <button class="primary-button" type="submit">Save attendance</button>
      </div>
    </form>
  `;

  document.querySelector("#attendance-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = loadAttendance().filter(
      (record) => !(
        record.schoolId === school.schoolId &&
        record.classId === classId &&
        record.date === date
      )
    );
    const now = new Date().toISOString();

    for (const student of students) {
      const status = String(data.get(`status:${student.studentId}`) || "present");
      next.push({
        attendanceId: id("attendance"),
        schoolId: school.schoolId,
        classId,
        studentId: student.studentId,
        sessionId: String(school.session?.name || ""),
        termId: String(school.term?.name || ""),
        date,
        status,
        createdAt: now,
        updatedAt: now
      });
    }

    saveAttendance(next);
    renderAttendanceList(school, classId, date);

    const notice = document.querySelector("#attendance-record-form");
    if (notice) {
      notice.insertAdjacentHTML(
        "afterbegin",
        `<div class="notice-card"><strong>Attendance saved successfully.</strong><p class="muted">${escapeHtml(selectedClass.name)}  ${escapeHtml(date)}</p></div>`
      );
    }
  });
}


const RESULTS_STORAGE_KEY = "skulgo.admin.results.v1";
const GRADE_SCALE_STORAGE_KEY = "skulgo.admin.grade-scale.v1";

function loadResultsRecords() {
  try {
    const parsed = JSON.parse(readStorage(RESULTS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadGradeScale() {
  try {
    const parsed = JSON.parse(readStorage(GRADE_SCALE_STORAGE_KEY) || "null");
    return parsed && Array.isArray(parsed.bands) ? parsed : null;
  } catch {
    return null;
  }
}

function calculateResultTotal(record) {
  const ca = Number.isFinite(Number(record.ca)) ? Number(record.ca) : undefined;
  const exam = Number.isFinite(Number(record.exam)) ? Number(record.exam) : undefined;
  const values = [ca, exam].filter((value) => value !== undefined);
  return values.length ? values.reduce((sum, value) => sum + value, 0) : undefined;
}

function calculateResultGrade(total, scale) {
  if (total === undefined || !scale?.bands?.length) return undefined;
  const bands = [...scale.bands].sort((a, b) => Number(a.minimumTotal) - Number(b.minimumTotal));
  return bands.find((band) => total >= Number(band.minimumTotal) && total <= Number(band.maximumTotal))?.label;
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
  const records = loadResultsRecords().filter((item) =>
    item.schoolId === school.schoolId &&
    String(item.sessionId || "") === String(school.session?.sessionId || school.session?.name || "") &&
    String(item.termId || "") === String(school.term?.termId || school.term?.name || "")
  );

  page.innerHTML = `
    <div class="section-heading">
      <div><h2>Results</h2><p class="muted">View student CA, exam, total and grade for the current academic period.</p></div>
    </div>
    <form class="form-card" id="results-selector">
      <div class="form-grid">
        <label>Class<select name="classId" required><option value="">Select class</option>${classes.map((item) => `<option value="${escapeHtml(item.classId)}">${escapeHtml(item.name)}</option>`).join("")}</select></label>
        <label>Subject<select name="subjectId" required><option value="">Select subject</option>${subjects.map((item) => `<option value="${escapeHtml(item.subjectId)}">${escapeHtml(item.name)}</option>`).join("")}</select></label>
        <label>Session<input value="${escapeHtml(school.session.name)}" readonly></label>
        <label>Term<input value="${escapeHtml(school.term.name)}" readonly></label>
      </div>
      <div class="form-actions"><button class="primary-button" type="submit">Load results</button></div>
    </form>
    <div id="results-list"></div>`;

  document.querySelector("#results-selector").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const classId = String(data.get("classId") || "");
    const subjectId = String(data.get("subjectId") || "");
    const selectedClass = classes.find((item) => item.classId === classId);
    const selectedSubject = subjects.find((item) => item.subjectId === subjectId);
    const gradeScale = loadGradeScale();

    if (!selectedClass || !selectedSubject) {
      document.querySelector("#results-list").innerHTML = '<p class="empty">Select a class and subject.</p>';
      return;
    }

    const classStudents = students.filter((student) => student.classId === classId);
    const rows = classStudents.map((student) => {
      const record = records.find((item) => item.studentId === student.studentId && item.classId === classId && item.subjectId === subjectId);
      const total = record ? calculateResultTotal(record) : undefined;
      return { student, record, total, grade: calculateResultGrade(total, gradeScale) };
    });

    document.querySelector("#results-list").innerHTML = `
      <div class="section-heading"><div><h3>${escapeHtml(selectedClass.name)} N/A ${escapeHtml(selectedSubject.name)}</h3><p class="muted">${escapeHtml(school.session.name)} - ${escapeHtml(school.term.name)}</p></div></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Student</th><th>Admission number</th><th>CA</th><th>Exam</th><th>Total</th><th>Grade</th></tr></thead>
        <tbody>${rows.length ? rows.map(({student,record,total,grade}) => `<tr><td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.admissionNumber || "N/A")}</td><td>${record?.ca ?? "N/A"}</td><td>${record?.exam ?? "N/A"}</td><td>${total ?? "N/A"}</td><td>${grade ?? "N/A"}</td></tr>`).join("") : '<tr><td colspan="6" class="empty">No students are enrolled in this class.</td></tr>'}</tbody>
      </table></div>
      ${rows.length && !records.some((item) => item.classId === classId && item.subjectId === subjectId) ? '<p class="muted">No result records have been entered for this class and subject yet.</p>' : ""}
      ${records.length && !gradeScale ? '<p class="muted">Grade scale is not configured, so the Grade column is shown as N/A.</p>' : ""}
    `;
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




















