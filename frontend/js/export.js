/* ================================================================
   EXPORT
   PDF (jsPDF + autotable) and Excel (SheetJS) export of the
   currently filtered record set (or full history if no filter
   is applied).
   ================================================================ */
const EXPORT = {
  rowsForExport(){
    return FILTERS.currentSet().map((r, i)=>[
      i + 1, r.date, r.deptName, r.officerName,
      r.keyboards > 0 ? r.keyboards : "—",
      r.mouse > 0 ? r.mouse : "—",
      r.other || "—"
    ]);
  },

  toPDF(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Department Asset Register", 14, 16);
    doc.setFontSize(9);
    const from = document.getElementById("filterFrom").value;
    const to = document.getElementById("filterTo").value;
    const rangeLabel = (from || to) ? `Range: ${from || "start"} to ${to || "today"}` : "Range: full history";
    doc.text(rangeLabel + "  |  Generated: " + new Date().toLocaleString(), 14, 22);

    doc.autoTable({
      startY: 28,
      head: [["S.No.","Date","Department Name","Name of Officer","Keyboards","Mouse","Other"]],
      body: this.rowsForExport(),
      styles:{ fontSize:8 },
      headStyles:{ fillColor:[22,51,58] }
    });

    doc.save("asset-register.pdf");
  },

  toExcel(){
    const rows = FILTERS.currentSet().map((r, i)=>({
      "S.No.": i + 1,
      Date: r.date,
      "Department Name": r.deptName,
      "Name of Officer": r.officerName,
      Keyboards: r.keyboards > 0 ? r.keyboards : "—",
      Mouse: r.mouse > 0 ? r.mouse : "—",
      Other: r.other || "—"
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Records");
    XLSX.writeFile(wb, "asset-register.xlsx");
  }
};
