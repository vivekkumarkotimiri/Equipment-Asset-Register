const APP = {

  showTab(name){
    document.querySelectorAll(".tab-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));
    document.getElementById(`tab-${name}`).style.display = "block";
    document.querySelector(`[data-tab="${name}"]`).classList.add("active");
  },

  renderIssueTable(){
    const body = document.getElementById("tableBody");
    const set  = FILTERS.currentSet();
    document.getElementById("recordCount").textContent =
      `${set.length} record${set.length===1?"":"s"} shown`;
    if(set.length === 0){
      body.innerHTML = `<tr class="empty-row"><td colspan="10">No records found.</td></tr>`;
      return;
    }
    body.innerHTML = set.map((r, i) => `
      <tr>
        <td>${i+1}</td>
        <td>${r.date}</td>
        <td>${escapeHtml(r.deptName)}</td>
        <td>${escapeHtml(r.officerName)}</td>
        <td>${escapeHtml(r.roomno)}</td>
        <td>${escapeHtml(r.extension)}</td>
        <td>${escapeHtml(r.material)}</td>
        <td>${r.quantity}</td>
        <td>${r.balance}</td>
        <td>${AUTH.isAdmin
          ? `<button class="btn-danger btn-small" onclick="ENTRIES.del('${r.id}')">Delete</button>`
          : ""}</td>
      </tr>
    `).join("");
  },

  async init(){
    CLOCK.start();
    AUTH.init();
    AUTH.renderAuthZone();
    ENTRIES.init();
    ENTRIES.resetForm();
    STOCK.init();
    await STORE.loadAll();
    this.renderIssueTable();
    STOCK.renderTable();
    STOCK.renderSummary();
    this.showTab("records");
  }
};

APP.init();