/* ================================================================
   APP
   Table rendering + bootstrap. This is the entry point — it runs
   last, after every other module has defined itself.
   ================================================================ */
const APP = {
  renderTable(){
    const body = document.getElementById("tableBody");
    const set = FILTERS.currentSet();
    document.getElementById("recordCount").textContent = `${set.length} record${set.length===1?"":"s"} shown`;

    if(set.length === 0){
      body.innerHTML = `<tr class="empty-row"><td colspan="8">No records found for this range.</td></tr>`;
      return;
    }

    body.innerHTML = set.map((r, i)=>`
      <tr>
        <td>${i + 1}</td>
        <td>${r.date}</td>
        <td>${escapeHtml(r.deptName)}</td>
        <td>${escapeHtml(r.officerName)}</td>
        <td>${r.keyboards > 0 ? r.keyboards : "—"}</td>
        <td>${r.mouse > 0 ? r.mouse : "—"}</td>
        <td>${escapeHtml(r.other || "—")}</td>
        <td>${AUTH.isAdmin
          ? `<button class="btn-danger btn-small" onclick="ENTRIES.del('${r.id}')">Delete</button>`
          : ""
        }</td>
      </tr>
    `).join("");
  },

  async init(){
    CLOCK.start();
    ENTRIES.initSelects();
    ENTRIES.resetForm();
    AUTH.init();
    AUTH.renderAuthZone();
    await STORE.loadAll();
    this.renderTable();
  }
};

APP.init();
