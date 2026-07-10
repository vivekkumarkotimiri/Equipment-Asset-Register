const FILTERS = {
  filtered: null,

  apply(){
    const from = document.getElementById("filterFrom").value;
    const to   = document.getElementById("filterTo").value;
    if(!from && !to){ this.filtered = null; }
    else{
      this.filtered = STORE.records.filter(r => {
        if(from && r.date < from) return false;
        if(to   && r.date > to)   return false;
        return true;
      });
    }
    APP.renderIssueTable();
  },

  clear(){
    document.getElementById("filterFrom").value = "";
    document.getElementById("filterTo").value   = "";
    this.filtered = null;
    APP.renderIssueTable();
  },

  currentSet(){ return this.filtered !== null ? this.filtered : STORE.records; }
};