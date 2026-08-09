(function () {
"use strict";

const C = window.JAG_CONFIG || {};
const CLOUD = !!(
  window.supabase &&
  C.SUPABASE_URL &&
  C.SUPABASE_ANON_KEY &&
  !C.SUPABASE_URL.includes("YOUR-PROJECT") &&
  !C.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")
);
const sb = CLOUD ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
const KEY = "jagdambaaBookings";
const $ = s => document.querySelector(s);
let rows = [];

const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[c]));

function localLoad(){ return JSON.parse(localStorage.getItem(KEY) || "[]"); }
function localSave(x){ localStorage.setItem(KEY, JSON.stringify(x)); }
function statusClass(s){ return "status-" + String(s||"").toLowerCase().replaceAll(" ","-"); }

function filtered(){
  const q = $("#search").value.toLowerCase();
  const f = $("#filter").value;
  const d = $("#dateFilter").value;

  return rows.filter(b => {
    const id = b.booking_id || b.id || "";
    const date = b.travel_date || b.date || "";
    const text = [
      id,b.customer_name,b.name,b.customer_phone,b.phone,b.pickup,b.destination
    ].join(" ").toLowerCase();

    return (f === "All" || b.status === f) &&
      (!d || date === d) &&
      (!q || text.includes(q));
  });
}

function render(){
  const all = rows;
  const list = filtered();

  const stats = [
    ["Total",all.length],
    ["Enquiry",all.filter(x=>x.status==="Enquiry").length],
    ["Quoted",all.filter(x=>x.status==="Quoted").length],
    ["Advance Pending",all.filter(x=>x.status==="Advance Pending").length],
    ["Confirmed",all.filter(x=>x.status==="Confirmed").length]
  ];

  $("#stats").innerHTML = stats.map(x =>
    `<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`
  ).join("");

  $("#tbody").innerHTML = list.length ? list.map(b => {
    const id = b.booking_id || b.id;
    const name = b.customer_name || b.name || "";
    const phone = b.customer_phone || b.phone || "";
    const date = b.travel_date || b.date || "";
    const time = b.pickup_time || b.time || "";

    return `<tr>
      <td><b>${esc(id)}</b><small>${b.created_at ? new Date(b.created_at).toLocaleString() : ""}</small></td>
      <td><b>${esc(name)}</b><small>${esc(phone)}</small></td>
      <td><b>${esc(b.pickup)} → ${esc(b.destination)}</b><small>${esc(b.trip_type || b.tripType || "")}</small></td>
      <td><b>${esc(date)}</b><small>${esc(time)}</small></td>
      <td>${esc(b.service)}</td>
      <td><b>${b.fare ? `₹${b.fare}` : "—"}</b>${b.advance ? `<small>Adv ₹${b.advance} • Bal ₹${b.balance ?? "—"}</small>` : ""}</td>
      <td><span class="status ${statusClass(b.status)}">${esc(b.status)}</span></td>
      <td><div class="row-actions">
        <button data-edit="${esc(id)}">Edit</button>
        <button data-wa="${esc(id)}">WhatsApp</button>
        <button data-del="${esc(id)}">Delete</button>
      </div></td>
    </tr>`;
  }).join("") : `<tr><td colspan="8" class="empty">No bookings found.</td></tr>`;
}

async function load(){
  if (CLOUD) {
    const {data,error} = await sb.from("bookings").select("*").order("created_at",{ascending:false});
    if (error) throw error;
    rows = data || [];
    $("#syncStatus").textContent = "☁️ Shared cloud bookings";
  } else {
    rows = localLoad();
    $("#syncStatus").textContent = "🧪 Local setup mode — configure Supabase for real sync";
  }
  render();
}

function demo(){
  if (CLOUD) {
    alert("Demo data is disabled in cloud mode so real data is not polluted.");
    return;
  }

  const d = n => {
    const x = new Date();
    x.setDate(x.getDate()+n);
    return x.toISOString().slice(0,10);
  };

  rows = [
    {
      id:"JT-DEMO-101",booking_id:"JT-DEMO-101",service:"With Driver",
      pickup:"Pune",destination:"Mumbai Airport",date:d(0),travel_date:d(0),
      time:"10:30",pickup_time:"10:30",passengers:4,trip_type:"Airport Transfer",
      name:"Demo Customer 1",customer_name:"Demo Customer 1",
      phone:"9000000001",customer_phone:"9000000001",
      status:"Confirmed",fare:2200,advance:1000,balance:1200,
      notes:"Airport pickup",created_at:new Date().toISOString()
    },
    {
      id:"JT-DEMO-102",booking_id:"JT-DEMO-102",service:"With Driver",
      pickup:"Pune",destination:"Mahabaleshwar",date:d(1),travel_date:d(1),
      time:"07:00",pickup_time:"07:00",passengers:6,trip_type:"Round Trip",
      name:"Demo Customer 2",customer_name:"Demo Customer 2",
      phone:"9000000002",customer_phone:"9000000002",
      status:"Advance Pending",fare:4500,advance:1000,balance:3500,
      notes:"Family trip",created_at:new Date().toISOString()
    }
  ];
  localSave(rows);
  render();
}

function openEdit(id){
  const b = rows.find(x => (x.booking_id || x.id) === id);
  if (!b) return;

  const values = {
    booking_id:b.booking_id || b.id,
    status:b.status,
    fare:b.fare ?? "",
    advance:b.advance ?? "",
    balance:b.balance ?? "",
    customer_name:b.customer_name || b.name || "",
    customer_phone:b.customer_phone || b.phone || "",
    notes:b.notes || ""
  };

  Object.entries(values).forEach(([k,v]) => {
    const el = $(`#editForm [name="${k}"]`);
    if (el) el.value = v;
  });

  $("#modal").classList.add("open");
}

async function saveEdit(e){
  e.preventDefault();

  const fd = new FormData(e.target);
  const id = fd.get("booking_id");

  const patch = {
    status:fd.get("status"),
    fare:fd.get("fare") ? Number(fd.get("fare")) : null,
    advance:fd.get("advance") ? Number(fd.get("advance")) : null,
    balance:fd.get("balance") ? Number(fd.get("balance")) : null,
    customer_name:fd.get("customer_name"),
    customer_phone:fd.get("customer_phone"),
    notes:fd.get("notes")
  };

  if (patch.fare != null && patch.advance != null && patch.balance == null) {
    patch.balance = patch.fare - patch.advance;
  }

  if (CLOUD) {
    const {error} = await sb.from("bookings").update(patch).eq("booking_id",id);
    if (error) { alert(error.message); return; }
  } else {
    const i = rows.findIndex(x => (x.booking_id || x.id) === id);
    if (i >= 0) rows[i] = {...rows[i],...patch};
    localSave(rows);
  }

  $("#modal").classList.remove("open");
  await load();
}

async function removeBooking(id){
  if (!confirm("Delete this booking?")) return;

  if (CLOUD) {
    const {error} = await sb.from("bookings").delete().eq("booking_id",id);
    if (error) { alert(error.message); return; }
  } else {
    rows = rows.filter(x => (x.booking_id || x.id) !== id);
    localSave(rows);
  }

  await load();
}

function sendWhatsApp(id){
  const b = rows.find(x => (x.booking_id || x.id) === id);
  if (!b) return;

  const name = b.customer_name || b.name || "";
  const phone = String(b.customer_phone || b.phone || "").replace(/\D/g,"");
  const msg = `Hello ${name}, this is Jagdambaa Tours & Travels regarding booking ${b.booking_id || b.id}. Status: ${b.status}. Fare: ${b.fare ? `₹${b.fare}` : "To be confirmed"}.`;

  window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`,"_blank");
}

function exportCsv(){
  if (!rows.length) { alert("No bookings to export."); return; }

  const cols = [
    "booking_id","customer_name","customer_phone","service","pickup",
    "destination","travel_date","pickup_time","passengers","trip_type",
    "status","fare","advance","balance","notes"
  ];

  const csv = [
    cols.join(","),
    ...rows.map(r => cols.map(c =>
      `"${String(r[c] ?? "").replaceAll('"','""')}"`
    ).join(","))
  ].join("\n");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = "jagdambaa-bookings.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

async function init(){
  $("#modeBadge").textContent = CLOUD ? "☁️ Cloud mode" : "🧪 Local setup mode";

  if (!CLOUD) {
    $("#loginView").hidden = true;
    $("#dashboardView").hidden = false;
    await load();
    return;
  }

  const {data} = await sb.auth.getSession();

  if (data.session) {
    $("#loginView").hidden = true;
    $("#dashboardView").hidden = false;
    $("#logout").hidden = false;
    await load();
  } else {
    $("#loginView").hidden = false;
    $("#dashboardView").hidden = true;
  }

  sb.auth.onAuthStateChange((_event,session) => {
    if (session) {
      $("#loginView").hidden = true;
      $("#dashboardView").hidden = false;
      $("#logout").hidden = false;
      load();
    } else {
      $("#loginView").hidden = false;
      $("#dashboardView").hidden = true;
      $("#logout").hidden = true;
    }
  });
}

$("#loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  if (!CLOUD) return;

  const email = $("#email").value;
  const password = $("#password").value;

  const {error} = await sb.auth.signInWithPassword({email,password});
  $("#loginMsg").textContent = error ? error.message : "Signed in.";
});

$("#logout")?.addEventListener("click", async () => {
  if (CLOUD) await sb.auth.signOut();
});

$("#refresh")?.addEventListener("click",load);
$("#demo")?.addEventListener("click",demo);
$("#export")?.addEventListener("click",exportCsv);
$("#search")?.addEventListener("input",render);
$("#filter")?.addEventListener("change",render);
$("#dateFilter")?.addEventListener("change",render);

$("#reset")?.addEventListener("click",() => {
  $("#search").value = "";
  $("#filter").value = "All";
  $("#dateFilter").value = "";
  render();
});

$("#close").onclick = $("#cancel").onclick = () => $("#modal").classList.remove("open");
$("#editForm").addEventListener("submit",saveEdit);

$("#tbody").addEventListener("click",e => {
  const button = e.target.closest("button");
  if (!button) return;
  if (button.dataset.edit) openEdit(button.dataset.edit);
  if (button.dataset.wa) sendWhatsApp(button.dataset.wa);
  if (button.dataset.del) removeBooking(button.dataset.del);
});

init();
})();