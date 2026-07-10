const ENTRIES = {

  init(){
    const matSel = document.getElementById("f_material");
    buildMaterialSelect(matSel);
    matSel.addEventListener("change", async () => {
      const val = matSel.value;
      document.getElementById("otherMaterialWrap").style.display = (val === "Other") ? "block" : "none";
      document.getElementById("f_material_other").value = "";
      document.getElementById("f_balance").value = "";
      if(val && val !== "Other"){
        const bal = await STORE.fetchBalance(val);
        document.getElementById("f_balance").value = bal;
      }
    });
    // When typing a custom material name, fetch its balance live
    document.getElementById("f_material_other").addEventListener("input", async function(){
      const name = this.value.trim();
      if(name.length > 1){
        const bal = await STORE.fetchBalance(name);
        document.getElementById("f_balance").value = bal;
      } else {
        document.getElementById("f_balance").value = "";
      }
    });
  },

  resetForm(){
    document.getElementById("f_deptName").value      = "";
    document.getElementById("f_officerName").value   = "";
    document.getElementById("f_roomno").value         = "";
    document.getElementById("f_extension").value      = "";
    document.getElementById("f_material").value       = "";
    document.getElementById("f_material_other").value = "";
    document.getElementById("f_quantity").value       = "";
    document.getElementById("f_balance").value        = "";
    document.getElementById("f_date").value           = new Date().toISOString().slice(0,10);
    document.getElementById("otherMaterialWrap").style.display = "none";
    document.getElementById("submitBtn").textContent  = "Save Record";
  },

  async submitForm(){
    if(!AUTH.isAdmin) return;
    const deptName    = document.getElementById("f_deptName").value.trim();
    const officerName = document.getElementById("f_officerName").value.trim();
    const roomno      = document.getElementById("f_roomno").value.trim();
    const extension   = document.getElementById("f_extension").value.trim();
    const matRaw      = document.getElementById("f_material").value;
    const material    = matRaw === "Other"
                          ? document.getElementById("f_material_other").value.trim()
                          : matRaw;
    const quantity    = Number(document.getElementById("f_quantity").value) || 0;
    const date        = document.getElementById("f_date").value || new Date().toISOString().slice(0,10);

    if(!deptName || !officerName){ alert("Department name and officer name are required."); return; }
    if(!material){ alert("Please select or enter a material."); return; }
    if(quantity <= 0){ alert("Issued quantity must be greater than 0."); return; }

    const available = await STORE.fetchBalance(material);
    if(quantity > available){
      alert(`Not enough stock. Available balance for "${material}" is ${available}.`);
      return;
    }

    try{
      await STORE.saveRecord({ date, deptName, officerName, roomno, extension, material, quantity });
      await STORE.loadAll();
      this.resetForm();
      FILTERS.clear();
    }catch(e){
      if(e.message?.toLowerCase().includes("log in")){ alert("Session expired. Please log in again."); AUTH.logout(); }
      else alert(e.message || "Failed to save record.");
    }
  },

  async del(id){
    if(!AUTH.isAdmin) return;
    if(!confirm("Delete this issue record? This cannot be undone.")) return;
    try{
      await STORE.deleteRecord(id);
      await STORE.loadAll();
      FILTERS.apply();
    }catch(e){ alert(e.message || "Failed to delete."); }
  }
};