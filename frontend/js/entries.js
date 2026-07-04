/* ================================================================
   ENTRIES
   Create-record logic for equipment records. Only reachable when
   AUTH.isAdmin is true. (No inline edit/delete — by design, the
   table has no actions column; remove a record's storage key
   directly via STORE.remove(id) from the console if needed.)
   ================================================================ */
const ENTRIES = {

  initSelects(){
    fillCountSelect(document.getElementById("f_keyboards"), CONFIG.maxEquipmentCount);
    fillCountSelect(document.getElementById("f_mouse"), CONFIG.maxEquipmentCount);
  },

  resetForm(){
    document.getElementById("f_deptName").value = "";
    document.getElementById("f_officerName").value = "";
    document.getElementById("f_keyboards").value = 1;
    document.getElementById("f_mouse").value = 1;
    document.getElementById("f_other").value = "";
    document.getElementById("f_date").value = new Date().toISOString().slice(0,10);
    document.getElementById("submitBtn").textContent = "Save Record";
  },

  async submitForm(){
    if(!AUTH.isAdmin) return;
    const deptName = document.getElementById("f_deptName").value.trim();
    const officerName = document.getElementById("f_officerName").value.trim();
    const date = document.getElementById("f_date").value || new Date().toISOString().slice(0,10);

    if(!deptName || !officerName){
      alert("Department name and name of officer are required.");
      return;
    }

    const record = {
      date,
      deptName,
      officerName,
      keyboards: Number(document.getElementById("f_keyboards").value) || 0,
      mouse: Number(document.getElementById("f_mouse").value) || 0,
      other: document.getElementById("f_other").value.trim()
    };

    try{
      await STORE.save(record);
      await STORE.loadAll();
      this.resetForm();
      FILTERS.clear();
    }catch(e){
      if(e.message && e.message.toLowerCase().includes("log in")){
        alert("Your admin session expired. Please log in again.");
        AUTH.logout();
      }else{
        alert(e.message || "Failed to save record.");
      }
    }
  },
  async del(id){
    if(!AUTH.isAdmin) return;
    if(!confirm("Delete this record? This cannot be undone.")) return;
    try{
      await STORE.remove(id);
      await STORE.loadAll();
      FILTERS.apply();
    }catch(e){
      alert(e.message || "Failed to delete record.");
    }
  }
};
