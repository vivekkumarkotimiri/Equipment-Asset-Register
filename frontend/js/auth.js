/* ================================================================
   AUTH
   Logs in against the backend (POST /api/login) and keeps the
   resulting token in memory + localStorage, so a logged-in admin
   stays logged in after a page refresh on that device. Every
   other device/browser is unaffected — they remain "public view"
   until they log in themselves.
   ================================================================ */
const AUTH = {
  isAdmin: false,
  token: null,

  init(){
    const saved = localStorage.getItem("assetRegisterToken");
    if(saved){
      this.token = saved;
      this.isAdmin = true; // optimistic; a write request will fail and log out if the token expired
    }
  },

  renderAuthZone(){
    const zone = document.getElementById("authZone");
    if(this.isAdmin){
      zone.innerHTML = `
        <span class="role-pill">Admin</span>
        <button class="btn-ghost btn-small" onclick="AUTH.logout()">Log out</button>
      `;
    }else{
      zone.innerHTML = `
        <span class="role-pill" style="background:transparent; color:var(--paper); border:1px solid var(--line);">Public view</span>
        <button class="btn-ghost btn-small" onclick="AUTH.openLogin()">Admin login</button>
      `;
    }
    document.getElementById("entryFormCard").style.display = this.isAdmin ? "block" : "none";
    APP.renderTable();
  },

  openLogin(){
    document.getElementById("loginError").textContent = "";
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";
    document.getElementById("loginOverlay").style.display = "flex";
  },
  closeLogin(){
    document.getElementById("loginOverlay").style.display = "none";
  },

  async attemptLogin(){
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value;
    const errorEl = document.getElementById("loginError");
    errorEl.textContent = "";

    try{
      const res = await fetch(`${CONFIG.apiBase}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if(!res.ok){
        errorEl.textContent = data.error || "Login failed.";
        return;
      }
      this.token = data.token;
      this.isAdmin = true;
      localStorage.setItem("assetRegisterToken", data.token);
      this.closeLogin();
      this.renderAuthZone();
    }catch(e){
      errorEl.textContent = "Could not reach the server. Is it running?";
    }
  },

  logout(){
    this.isAdmin = false;
    this.token = null;
    localStorage.removeItem("assetRegisterToken");
    this.renderAuthZone();
  }
};
