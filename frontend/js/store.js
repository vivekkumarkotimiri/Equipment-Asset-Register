/* ================================================================
   STORE
   Talks to the backend REST API (server.js + db.js) instead of
   any browser-only storage, so records are kept permanently in
   the server's SQLite database and are the same for every device
   that opens this page. AUTH.token is sent along with write
   requests so the server can confirm admin rights.
   ================================================================ */
const STORE = {
  records: [],

  async loadAll(){
    try{
      const res = await fetch(`${CONFIG.apiBase}/api/records`, { signal: AbortSignal.timeout(5000) });
      if(!res.ok) throw new Error("Failed to load records");
      const data = await res.json();
      this.records = data.records || [];
    }catch(e){
      console.error("Failed to load records", e);
      this.records = [];
    }
  },

  async save(record){
    const res = await fetch(`${CONFIG.apiBase}/api/records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AUTH.token}`
      },
      body: JSON.stringify(record)
    });
    const data = await res.json();
    if(!res.ok){
      throw new Error(data.error || "Failed to save record.");
    }
    return data.record;
  },

  async remove(id){
    const res = await fetch(`${CONFIG.apiBase}/api/records/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${AUTH.token}` }
    });
    if(!res.ok){
      const data = await res.json().catch(()=>({}));
      throw new Error(data.error || "Failed to delete record.");
    }
  }
};
