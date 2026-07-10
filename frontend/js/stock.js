const STOCK = {
  editingId: null,

  init(){
    const matSel = document.getElementById("s_material");
    buildMaterialSelect(matSel);
    document.getElementById("s_date").value = new Date().toISOString().slice(0,10);

    matSel.addEventListener("change", () => {
      const val = matSel.value;
      document.getElementById("s_otherMaterialWrap").style.display =
        (val === "Other") ? "block" : "none";
      document.getElementById("s_material_other").value = "";
    });
  },

  resetForm(){
    document.getElementById("s_date").value           = new Date().toISOString().slice(0,10);
    document.getElementById("s_material").value       = "";
    document.getElementById("s_material_other").value = "";
    document.getElementById("s_quantity").value       = "";
    document.getElementById("s_otherMaterialWrap").style.display = "none";
    document.getElementById("s_submitBtn").textContent = "Save";
    this.editingId = null;
  },

  async submitForm(){
    if(!AUTH.isAdmin) return;
    const date     = document.getElementById("s_date").value || new Date().toISOString().slice(0,10);
    const matRaw   = document.getElementById("s_material").value;
    const material = matRaw === "Other"
                       ? document.getElementById("s_material_other").value.trim()
                       : matRaw;
    const quantity = Number(document.getElementById("s_quantity").value) || 0;

    if(!material){ alert("Please select or enter a material name."); return; }
    if(quantity <= 0){ alert("Quantity must be greater than 0."); return; }

    try{
      if(this.editingId){
        await STORE.updateStock(this.editingId, { date, material, quantity });
      }else{
        await STORE.saveStock({ date, material, quantity });
      }
      await STORE.loadAll();
      this.resetForm();
      this.renderTable();
      this.renderSummary();
      APP.renderIssueTable();
    }catch(e){
      if(e.message?.toLowerCase().includes("log in")){ alert("Session expired."); AUTH.logout(); }
      else alert(e.message || "Failed to save.");
    }
  },

  edit(id){
    const entry = STORE.stock.find(s => s.id === id);
    if(!entry) return;
    document.getElementById("s_date").value     = entry.date;
    document.getElementById("s_quantity").value = entry.quantity;

    const isStandard = CONFIG.MATERIALS.includes(entry.material) && entry.material !== "Other";
    if(isStandard){
      document.getElementById("s_material").value = entry.material;
      document.getElementById("s_otherMaterialWrap").style.display = "none";
      document.getElementById("s_material_other").value = "";
    }else{
      document.getElementById("s_material").value       = "Other";
      document.getElementById("s_material_other").value = entry.material;
      document.getElementById("s_otherMaterialWrap").style.display = "block";
    }

    document.getElementById("s_submitBtn").textContent = "Update";
    this.editingId = id;
    document.getElementById("stockFormCard").scrollIntoView({ behavior:"smooth" });
  },

  async del(id){
    if(!AUTH.isAdmin) return;
    if(!confirm("Delete this stock entry? This cannot be undone.")) return;
    try{
      await STORE.deleteStock(id);
      await STORE.loadAll();
      this.resetForm();
      this.renderTable();
      this.renderSummary();
      APP.renderIssueTable();
    }catch(e){ alert(e.message || "Failed to delete."); }
  },

  renderTable(){
    const body = document.getElementById("stockTableBody");
    const set  = STORE.stock;
    document.getElementById("stockCount").textContent =
      `${set.length} entr${set.length===1?"y":"ies"}`;
    if(set.length === 0){
      body.innerHTML = `<tr class="empty-row"><td colspan="5">No stock entries yet.</td></tr>`;
      return;
    }
    body.innerHTML = set.map((s, i) => `
      <tr>
        <td>${i+1}</td>
        <td>${s.date}</td>
        <td>${escapeHtml(s.material)}</td>
        <td>${s.quantity}</td>
        <td>
          <button class="btn-edit btn-small" onclick="STOCK.edit('${s.id}')">Edit</button>
          <button class="btn-danger btn-small" onclick="STOCK.del('${s.id}')">Delete</button>
        </td>
      </tr>
    `).join("");
  },

  /* ---- Summary helpers ---- */
  _buildSummaryData(){
    const materials = [...new Set([
      ...STORE.stock.map(s => s.material),
      ...STORE.records.map(r => r.material)
    ])].sort();

    return materials.map((mat, i) => {
      const totalStocked = STORE.stock
        .filter(s => s.material === mat)
        .reduce((sum, s) => sum + Number(s.quantity), 0);
      const totalIssued = STORE.records
        .filter(r => r.material === mat)
        .reduce((sum, r) => sum + Number(r.quantity), 0);
      return { sno: i+1, material: mat, totalStocked, totalIssued, balance: totalStocked - totalIssued };
    });
  },

  renderSummary(){
    const body = document.getElementById("summaryTableBody");
    const rows = this._buildSummaryData();

    if(rows.length === 0){
      body.innerHTML = `<tr class="empty-row"><td colspan="5">No data yet.</td></tr>`;
      return;
    }
    body.innerHTML = rows.map(r => {
      const balStyle = r.balance < 0
        ? "color:var(--bad);font-weight:600;"
        : r.balance === 0
          ? "color:#999;"
          : "color:var(--good);font-weight:600;";
      return `
        <tr>
          <td>${r.sno}</td>
          <td>${escapeHtml(r.material)}</td>
          <td>${r.totalStocked}</td>
          <td>${r.totalIssued}</td>
          <td style="${balStyle}">${r.balance}</td>
        </tr>
      `;
    }).join("");
  },

  exportSummaryPDF(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(13);
    doc.text("Material Stock Summary", 14, 14);
    doc.setFontSize(8);
    doc.text("Generated: " + new Date().toLocaleString(), 14, 20);
    doc.autoTable({
      startY: 26,
      head: [["S.No.", "Material", "Total Stocked", "Total Issued", "Current Balance"]],
      body: this._buildSummaryData().map(r => [
        r.sno, r.material, r.totalStocked, r.totalIssued, r.balance
      ]),
      styles:{ fontSize:9 },
      headStyles:{ fillColor:[22,51,58] },
      bodyStyles:{ halign:"left" },
      columnStyles:{
        2:{ halign:"center" },
        3:{ halign:"center" },
        4:{ halign:"center" }
      }
    });
    doc.save("material-stock-summary.pdf");
  },

  exportSummaryExcel(){
    const rows = this._buildSummaryData().map(r => ({
      "S.No.":           r.sno,
      "Material":        r.material,
      "Total Stocked":   r.totalStocked,
      "Total Issued":    r.totalIssued,
      "Current Balance": r.balance
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch:6 },{ wch:22 },{ wch:14 },{ wch:13 },{ wch:16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Summary");
    XLSX.writeFile(wb, "material-stock-summary.xlsx");
  }
};