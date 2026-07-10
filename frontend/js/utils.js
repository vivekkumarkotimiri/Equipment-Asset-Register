function escapeHtml(str){
  if(str === null || str === undefined) return "—";
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
}

function buildMaterialSelect(selectEl, selectedVal){
  selectEl.innerHTML = `<option value="">— Select Material —</option>`;
  CONFIG.MATERIALS.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m; opt.textContent = m;
    if(m === selectedVal) opt.selected = true;
    selectEl.appendChild(opt);
  });
}