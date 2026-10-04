const REPORT_CARD_REVENUE_STORAGE_KEY = "skulgo.admin.report-card-revenue.v1";

function loadReportCardRevenue() {
  try {
    const parsed = JSON.parse(readStorage(REPORT_CARD_REVENUE_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveReportCardRevenue(settings) {
  writeStorage(REPORT_CARD_REVENUE_STORAGE_KEY, JSON.stringify(settings));
}

function getReportCardRevenueSettings(school) {
  const all = loadReportCardRevenue();
  return all[school?.schoolId] || {
    enabled: false,
    feeAmount: 0,
    currency: "NGN",
    schoolSharePercent: 50,
    skulgoSharePercent: 50
  };
}

function renderReportCardRevenue() {
  const school = loadSchool();

  if (!school?.schoolId) {
    page.innerHTML = '<h2>Report Card Revenue</h2><p class="muted">Complete School Setup before configuring paid report-card publishing.</p>';
    return;
  }

  const settings = getReportCardRevenueSettings(school);

  page.innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Report Card Revenue</h2>
        <p class="muted">Optional paid publishing for schools that want to charge students for official report cards.</p>
      </div>
      <span class="revenue-status ${settings.enabled ? "enabled" : "disabled"}">${settings.enabled ? "Enabled" : "Disabled"}</span>
    </div>

    <form class="form-card revenue-settings-card" id="report-card-revenue-form">
      <label class="revenue-toggle">
        <input type="checkbox" name="enabled" ${settings.enabled ? "checked" : ""}>
        <span>
          <strong>Enable paid Report Card publishing</strong>
          <small>When enabled, the configured fee applies to each student's official report card.</small>
        </span>
      </label>

      <div class="form-grid">
        <label>Fee per student
          <input name="feeAmount" type="number" min="0" step="1" value="${escapeHtml(settings.feeAmount)}" placeholder="e.g. 1000">
        </label>
        <label>Currency
          <input value="NGN" readonly>
        </label>
      </div>

      <div class="revenue-split">
        <div>
          <span>School share</span>
          <strong>50%</strong>
        </div>
        <div>
          <span>SkulGo share</span>
          <strong>50%</strong>
        </div>
      </div>

      <div class="revenue-example">
        <strong>Example</strong>
        <p>For a ₦1,000 report-card fee: ₦500 goes to the school and ₦500 goes to SkulGo, before any payment-provider processing charges.</p>
      </div>

      <div class="revenue-note">
        <strong>Payment integration</strong>
        <p>This offline setting does not collect or verify money. A future secure payment service will confirm the student's payment and settle the 50/50 split. Do not treat a local browser setting as proof of payment.</p>
      </div>

      <div class="form-actions">
        <button class="primary-button" type="submit">Save Revenue Settings</button>
      </div>
      <p class="form-message" id="revenue-save-message" role="status" aria-live="polite"></p>
    </form>
  `;

  document.querySelector("#report-card-revenue-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const all = loadReportCardRevenue();
    const feeAmount = Math.max(0, Math.round(Number(data.get("feeAmount") || 0)));

    all[school.schoolId] = {
      enabled: data.get("enabled") === "on",
      feeAmount,
      currency: "NGN",
      schoolSharePercent: 50,
      skulgoSharePercent: 50,
      updatedAt: new Date().toISOString()
    };

    saveReportCardRevenue(all);

    const message = document.querySelector("#revenue-save-message");
    message.textContent = "Report Card Revenue settings saved.";
    renderReportCardRevenue();
  });
}

(function registerReportCardRevenueModule() {
  const revenueNav = document.createElement("button");
  revenueNav.className = "nav-item";
  revenueNav.dataset.section = "report-card-revenue";
  revenueNav.textContent = "Report Card Revenue";

  const reportCardNav = document.querySelector('[data-section="report-card"]');
  reportCardNav?.insertAdjacentElement("afterend", revenueNav);

  revenueNav.addEventListener("click", () => {
    nav.forEach((item) => item.classList.remove("active"));
    revenueNav.classList.add("active");
    title.textContent = "Report Card Revenue";
    renderReportCardRevenue();
  });
})();
