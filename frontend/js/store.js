const STORE = {
  records: [],
  stock:   [],

  async loadAll(){ await Promise.all([this.loadRecords(), this.loadStock()]); },

  async loadRecords(){
    try{
      const res  = await fetch(`${CONFIG.apiBase}/api/records`);
      const data = await res.json();
      this.records = data.records || [];
    }catch(e){ console.error("load records:", e); this.records = []; }
  },

  async loadStock(){
    try{
      const res  = await fetch(`${CONFIG.apiBase}/api/stock`);
      const data = await res.json();
      this.stock = data.stock || [];
    }catch(e){ console.error("load stock:", e); this.stock = []; }
  },

  async saveRecord(record){
    const res  = await fetch(`${CONFIG.apiBase}/api/records`, {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${AUTH.token}` },
      body: JSON.stringify(record)
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || "Failed to save record.");
    return data.record;
  },

  async deleteRecord(id){
    const res = await fetch(`${CONFIG.apiBase}/api/records/${id}`, {
      method:"DELETE", headers:{ "Authorization":`Bearer ${AUTH.token}` }
    });
    if(!res.ok){ const d = await res.json().catch(()=>({})); throw new Error(d.error||"Failed to delete."); }
  },

  async saveStock(entry){
    const res  = await fetch(`${CONFIG.apiBase}/api/stock`, {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${AUTH.token}` },
      body: JSON.stringify(entry)
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || "Failed to save stock entry.");
    return data.entry;
  },

  async updateStock(id, entry){
    const res  = await fetch(`${CONFIG.apiBase}/api/stock/${id}`, {
      method:"PUT",
      headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${AUTH.token}` },
      body: JSON.stringify(entry)
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || "Failed to update stock entry.");
    return data.entry;
  },

  async deleteStock(id){
    const res = await fetch(`${CONFIG.apiBase}/api/stock/${id}`, {
      method:"DELETE", headers:{ "Authorization":`Bearer ${AUTH.token}` }
    });
    if(!res.ok){ const d = await res.json().catch(()=>({})); throw new Error(d.error||"Failed to delete."); }
  },

  async fetchBalance(material){
    const res  = await fetch(`${CONFIG.apiBase}/api/balance/${encodeURIComponent(material)}`);
    const data = await res.json();
    return data.balance ?? 0;
  }
};