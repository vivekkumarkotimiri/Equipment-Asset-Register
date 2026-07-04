/* ================================================================
   CONFIG
   apiBase is empty because the backend serves this frontend itself
   (same origin) — fetch("/api/...") works as-is. If you ever host
   the frontend separately from the backend, set apiBase to the
   backend's full URL, e.g. "http://192.168.1.20:3000".
   ================================================================ */
const CONFIG = {
  apiBase: "",
  maxEquipmentCount: 10   // dropdown options for keyboards/mouse: 1..10
};
