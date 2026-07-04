/* ================================================================
   CLOCK
   Live date / time display in the header.
   ================================================================ */
const CLOCK = {
  start(){
    this.tick();
    setInterval(()=>this.tick(), 1000);
  },
  tick(){
    const now = new Date();
    document.getElementById("liveDate").textContent =
      now.toLocaleDateString(undefined, {weekday:'short', year:'numeric', month:'short', day:'numeric'});
    document.getElementById("liveTime").textContent =
      now.toLocaleTimeString(undefined, {hour12:true});
  }
};
