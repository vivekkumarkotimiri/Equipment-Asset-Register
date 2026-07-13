const AUTH = {
  isAdmin: false,
  isUser:  false,  // "user" role — issue entry only
  token:   null,

  init(){
    const saved = localStorage.getItem("stockRegisterToken");
    const role  = localStorage.getItem("stockRegisterRole");
    if(saved){
      this.token   = saved;
      this.isAdmin = (role === "admin");
      this.isUser  = (role === "user");
    }
  },

  /* Which tabs are visible per role:
     public  → Records only
     user    → Records + Issue Entry
     admin   → Records + Issue Entry + Stock Entry             */
  renderAuthZone(){
    const zone = document.getElementById("authZone");

    if(this.isAdmin || this.isUser){
      const label = this.isAdmin ? "Admin" : "User";
      zone.innerHTML = `
        <span class="role-pill">${label}</span>
        <button class="btn-ghost btn-small" onclick="AUTH.logout()">Log out</button>
      `;
    }else{
      zone.innerHTML = `
        <span class="role-pill public-pill">Public view</span>
        <button class="btn-ghost btn-small" onclick="AUTH.openLogin()">Login</button>
      `;
    }

    // Issue Entry tab — visible to admin and user
    document.querySelectorAll(".member-only").forEach(el => {
      el.style.display = (this.isAdmin || this.isUser) ? "inline-flex" : "none";
    });

    // Stock Entry tab — admin only
    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = this.isAdmin ? "inline-flex" : "none";
    });

    APP.renderIssueTable();
  },

  /* ---- CAPTCHA ---- */
  _captchaAnswer: null,
  generateCaptcha(){
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    this._captchaAnswer = a + b;
    document.getElementById("captchaQuestion").textContent = `What is ${a} + ${b} ?`;
    document.getElementById("captchaInput").value = "";
  },

  openLogin(){
    document.getElementById("loginError").textContent = "";
    document.getElementById("loginUser").value  = "";
    document.getElementById("loginPass").value  = "";
    document.getElementById("loginOverlay").style.display = "flex";
    this.generateCaptcha();
  },
  closeLogin(){
    document.getElementById("loginOverlay").style.display = "none";
  },

  async attemptLogin(){
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value;
    const captcha  = Number(document.getElementById("captchaInput").value);
    const errEl    = document.getElementById("loginError");
    errEl.textContent = "";

    // Validate CAPTCHA first
    if(captcha !== this._captchaAnswer){
      errEl.textContent = "Incorrect answer to the security question.";
      this.generateCaptcha();
      return;
    }

    try{
      const res  = await fetch(`${CONFIG.apiBase}/api/login`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if(!res.ok){ errEl.textContent = data.error || "Login failed."; this.generateCaptcha(); return; }

      this.token   = data.token;
      this.isAdmin = (data.role === "admin");
      this.isUser  = (data.role === "user");
      localStorage.setItem("stockRegisterToken", data.token);
      localStorage.setItem("stockRegisterRole",  data.role);
      this.closeLogin();
      this.renderAuthZone();
    }catch(e){
      errEl.textContent = "Could not reach the server. Is it running?";
      this.generateCaptcha();
    }
  },

  logout(){
    this.isAdmin = false;
    this.isUser  = false;
    this.token   = null;
    localStorage.removeItem("stockRegisterToken");
    localStorage.removeItem("stockRegisterRole");
    this.renderAuthZone();
    APP.showTab("records");
  }
};