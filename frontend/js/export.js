const EXPORT = {
  rowsForExport(){
    return FILTERS.currentSet().map((r, i) => [
      i+1, r.date, r.deptName, r.officerName,
      r.roomno||"—", r.extension||"—",
      r.material, r.quantity, r.balance
    ]);
  },

  toPDF(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:"landscape" });
    doc.setFontSize(13);
    doc.text("Stock Issue Register", 14, 14);
    doc.setFontSize(8);
    const from = document.getElementById("filterFrom").value;
    const to   = document.getElementById("filterTo").value;
    const range = (from||to) ? `Range: ${from||"start"} – ${to||"today"}` : "Full history";
    doc.text(range + "   |   Generated: " + new Date().toLocaleString(), 14, 20);
    doc.autoTable({
      startY: 26,
      head:[["S.No.","Date","Department","Name of the Officer","Room No.","Extension","Material","Issued Qty","Balance"]],
      body: this.rowsForExport(),
      styles:{ fontSize:7 }, headStyles:{ fillColor:[22,51,58] }
    });
    doc.save("stock-issue-register.pdf");
  },

  toExcel(){
    const rows = FILTERS.currentSet().map((r, i) => ({
      "S.No.": i+1, Date: r.date,
      "Department Name": r.deptName, "Name of the Officer": r.officerName,
      "Room No": r.roomno||"","Extension": r.extension||"",
      "Material": r.material, "Issued Qty": r.quantity, "Balance": r.balance
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Issue Records");
    XLSX.writeFile(wb, "stock-issue-register.xlsx");
  }
};