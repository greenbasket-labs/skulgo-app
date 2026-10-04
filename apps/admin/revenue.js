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
  page.innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Report Card Revenue</h2>
        <p class="muted">Paid report-card publishing is an upcoming feature.</p>
      </div>
    </div>
    <div class="card">
      <h3>Coming soon</h3>
      <p>We are speaking with schools first to understand how report-card printing and publishing should work before introducing any payment or revenue settings.</p>
      <p class="muted">No payment is collected, configured or required in this version.</p>
    </div>
  `;
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
