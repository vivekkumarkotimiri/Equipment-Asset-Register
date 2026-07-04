/* ================================================================
   UTILS
   Small shared helper functions used across files.
   ================================================================ */
function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Fills a <select> with numeric options 1..max (used for keyboard/mouse counts)
function fillCountSelect(selectEl, max){
  selectEl.innerHTML = "";
  // blank / optional first option
  const blank = document.createElement("option");
  blank.value = 0;
  blank.textContent = "—";
  selectEl.appendChild(blank);
  for(let i = 1; i <= max; i++){
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    selectEl.appendChild(opt);
  }
}
