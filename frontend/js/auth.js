const AUTH = {
  isAdmin: false,
  token:   null,

  init(){
    const saved = localStorage.getItem("stockRegisterToken");
    if(saved){ this.token = saved; this.isAdmin = true; }
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
        <span class="role-pill public-pill">Public view</span>
        <button class="btn-ghost btn-small" onclick="AUTH.openLogin()">Admin login</button>
      `;
    }
    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = this.isAdmin ? "inline-flex" : "none";
    });
    APP.renderIssueTable();
  },

  openLogin(){
    document.getElementById("loginError").textContent = "";
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";
    document.getElementById("loginOverlay").style.display = "flex";
  },
  closeLogin(){ document.getElementById("loginOverlay").style.display = "none"; },

  async attemptLogin(){
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value;
    const errEl    = document.getElementById("loginError");
    errEl.textContent = "";
    try{
      const res  = await fetch(`${CONFIG.apiBase}/api/login`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if(!res.ok){ errEl.textContent = data.error || "Login failed."; return; }
      this.token = data.token; this.isAdmin = true;
      localStorage.setItem("stockRegisterToken", data.token);
      this.closeLogin();
      this.renderAuthZone();
    }catch(e){ errEl.textContent = "Could not reach the server."; }
  },

  logout(){
    this.isAdmin = false; this.token = null;
    localStorage.removeItem("stockRegisterToken");
    this.renderAuthZone();
    APP.showTab("records");
  }
};