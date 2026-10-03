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

const nav = document.querySelectorAll(".nav-item");
const title = document.querySelector("#page-title");
const page = document.querySelector("#page");

nav.forEach((button) => {
  button.addEventListener("click", () => {
    nav.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    const [heading, description] = labels[button.dataset.section];
    title.textContent = heading;

    if (button.dataset.section === "school") {
      page.innerHTML = `
        <h2>School setup</h2>
        <p class="muted">Manage the school's identity and current academic period.</p>
        <div class="info-grid">
          <div class="info-card"><span>School</span><strong>Your school</strong></div>
          <div class="info-card"><span>Academic session</span><strong>Not configured</strong></div>
          <div class="info-card"><span>Current term</span><strong>Not configured</strong></div>
        </div>`;
      return;
    }

    page.innerHTML = `
      <h2>${description}</h2>
      <p class="muted">This section is part of the Admin workspace shell. Its existing module will provide the records and actions.</p>`;
  });
});
