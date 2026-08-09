(function(){
"use strict";

const C=window.JAG_CONFIG||{};
const CLOUD=!!(window.supabase&&C.SUPABASE_URL&&C.SUPABASE_ANON_KEY&&!String(C.SUPABASE_URL).includes("YOUR-PROJECT")&&!String(C.SUPABASE_ANON_KEY).includes("YOUR_SUPABASE"));
const sb=CLOUD?window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY):null;
const KEY="jagdambaaBookings";
const SESSION="jagdambaaAdminSessionV14";
const DEMO_USER="admin";
const DEMO_PASS="Jagdambaa@123";
const ADMIN_EMAIL=C.ADMIN_EMAIL && !String(C.ADMIN_EMAIL).includes("YOUR_") ? C.ADMIN_EMAIL : "";
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let rows=[];

function localLoad(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}
function localSave(x){localStorage.setItem(KEY,JSON.stringify(x))}
function statusClass(s){return "status-"+String(s||"").toLowerCase().replaceAll(" ","-")}

function demoRows(){
  const now=new Date(), iso=d=>d.toISOString().slice(0,10);
  const d1=new Date(now);d1.setDate(now.getDate()+1);
  const d2=new Date(now);d2.setDate(now.getDate()+2);
  return [
    {booking_id:"JT-DEMO-001",created_at:now.toISOString(),customer_name:"Rahul Patil",customer_phone:"9876543210",pickup:"Pune Station",destination:"Mumbai Airport",travel_date:iso(d1),pickup_time:"08:30",service:"With Driver",passengers:4,trip_type:"Airport Transfer",status:"Enquiry",fare:null,advance:null,balance:null,notes:"Demo enquiry"},
    {booking_id:"JT-DEMO-002",created_at:now.toISOString(),customer_name:"Sneha Joshi",customer_phone:"9988776655",pickup:"Pune",destination:"Mahabaleshwar",travel_date:iso(d2),pickup_time:"06:00",service:"With Driver",passengers:5,trip_type:"Round Trip",status:"Advance Pending",fare:6500,advance:2000,balance:4500,notes:"Demo quotation"},
    {booking_id:"JT-DEMO-003",created_at:now.toISOString(),customer_name:"Amit Shah",customer_phone:"9123456789",pickup:"Mumbai",destination:"Pune",travel_date:iso(d1),pickup_time:"14:00",service:"With Driver",passengers:3,trip_type:"One Way",status:"Confirmed",fare:4200,advance:1000,balance:3200,notes:"Demo confirmed"},
    {booking_id:"JT-DEMO-004",created_at:now.toISOString(),customer_name:"Priya Kulkarni",customer_phone:"9012345678",pickup:"Pune",destination:"Goa",travel_date:iso(d2),pickup_time:"05:30",service:"With Driver",passengers:6,trip_type:"Multi-Day",status:"Completed",fare:18000,advance:5000,balance:13000,notes:"Demo completed"}
  ];
}

function seedDemo(){
  const current=localLoad(), ids=new Set(current.map(x=>x.booking_id));
  const merged=[...current,...demoRows().filter(x=>!ids.has(x.booking_id))];
  localSave(merged);rows=merged;render();
}

async function cloudLoad(){
  const {data,error}=await sb.from("bookings").select("*").order("created_at",{ascending:false});
  if(error)throw error;
  return data||[];
}

async function load(){
  try{
    if(CLOUD){
      rows=await cloudLoad();
      $("#syncStatus").textContent=`Shared cloud bookings • ${rows.length} records`;
    }else{
      rows=localLoad();
      $("#syncStatus").textContent=`Local prototype bookings • ${rows.length} records`;
    }
    render();
  }catch(err){
    console.error(err);
    $("#syncStatus").textContent="Cloud error — local data available";
    rows=localLoad();render();
    alert("Cloud dashboard could not load: "+(err.message||err));
  }
}

function render(){
  const q=($("#search")?.value||"").toLowerCase(),f=$("#filter")?.value||"All",d=$("#dateFilter")?.value||"";
  const list=rows.filter(b=>{
    const text=[b.booking_id,b.customer_name,b.customer_phone,b.pickup,b.destination,b.service,b.trip_type].join(" ").toLowerCase();
    return (f==="All"||b.status===f)&&(!d||b.travel_date===d)&&(!q||text.includes(q));
  });
  const stats=[
    ["Total",rows.length],["Enquiry",rows.filter(x=>x.status==="Enquiry").length],
    ["Quoted",rows.filter(x=>x.status==="Quoted").length],
    ["Advance Pending",rows.filter(x=>x.status==="Advance Pending").length],
    ["Confirmed",rows.filter(x=>x.status==="Confirmed").length],
    ["Completed",rows.filter(x=>x.status==="Completed").length]
  ];
  $("#stats").innerHTML=stats.map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("");

  $("#tbody").innerHTML=list.length?list.map(b=>`<tr>
    <td><b>${esc(b.booking_id)}</b><small>${b.created_at?new Date(b.created_at).toLocaleString():""}</small></td>
    <td><b>${esc(b.customer_name)}</b><small>${esc(b.customer_phone)}</small></td>
    <td><b>${esc(b.pickup)} → ${esc(b.destination)}</b><small>${esc(b.trip_type)}</small></td>
    <td><b>${esc(b.travel_date)}</b><small>${esc(b.pickup_time)}</small></td>
    <td>${esc(b.service)}</td>
    <td><b>${b.fare!=null?`₹${b.fare}`:"—"}</b>${b.advance!=null?`<small>Adv ₹${b.advance} • Bal ₹${b.balance??"—"}</small>`:""}</td>
    <td><span class="status ${statusClass(b.status)}">${esc(b.status)}</span></td>
    <td><div class="v14-actions">
      <button data-edit="${esc(b.booking_id)}">Edit</button>
      ${b.status==="Enquiry"?`<button class="success" data-approve="${esc(b.booking_id)}">Approve</button>`:""}
      ${b.status==="Advance Pending"?`<button class="success" data-confirm="${esc(b.booking_id)}">Payment ✓</button>`:""}
      ${b.status==="Confirmed"?`<button class="success" data-complete="${esc(b.booking_id)}">Complete</button>`:""}
      ${b.status!=="Cancelled"&&b.status!=="Completed"?`<button class="danger" data-reject="${esc(b.booking_id)}">Reject</button>`:""}
      <button data-wa="${esc(b.booking_id)}">WhatsApp</button>
      <button data-email="${esc(b.booking_id)}">Email</button>
    </div></td>
  </tr>`).join(""):`<tr><td colspan="8" class="empty">No bookings found.</td></tr>`;
}

function find(id){return rows.find(x=>x.booking_id===id)}

function openEdit(id){
  const b=find(id);if(!b)return;
  [["booking_id",b.booking_id],["status",b.status],["fare",b.fare??""],["advance",b.advance??""],["balance",b.balance??""],["customer_name",b.customer_name],["customer_phone",b.customer_phone],["notes",b.notes||""]]
  .forEach(([k,v])=>{const e=$(`#editForm [name="${k}"]`);if(e)e.value=v});
  $("#modal").classList.add("open");
}

async function update(id,patch){
  try{
    if(CLOUD){
      const {error}=await sb.from("bookings").update(patch).eq("booking_id",id);
      if(error)throw error;
    }else{
      const i=rows.findIndex(x=>x.booking_id===id);if(i<0)return false;
      rows[i]={...rows[i],...patch};localSave(rows);
    }
    await load();return true;
  }catch(err){alert("Update failed: "+(err.message||err));return false}
}

function bookingMessage(b,type){
  if(type==="quote")return `Hello ${b.customer_name}, your Jagdambaa Tours & Travels request ${b.booking_id} has been approved for quotation. Fare: ₹${b.fare}. Advance: ₹${b.advance??"To be confirmed"}. Please reply to proceed with payment.`;
  if(type==="confirmed")return `Hello ${b.customer_name}, your Jagdambaa Tours & Travels booking ${b.booking_id} is CONFIRMED. Fare: ₹${b.fare}. Advance received: ₹${b.advance??0}. Balance: ₹${b.balance??0}.`;
  if(type==="completed")return `Hello ${b.customer_name}, thank you for travelling with Jagdambaa Tours & Travels. Booking ${b.booking_id} is marked completed.`;
  return `Hello ${b.customer_name}, your Jagdambaa Tours & Travels request ${b.booking_id} was not accepted. Reason: ${b.notes||"Unavailable"}.`;
}

function openWhatsApp(b,type="quote"){
  const phone=String(b.customer_phone||"").replace(/\D/g,"");
  if(phone.length!==10){alert("Customer mobile number is not a valid 10-digit number.");return}
  window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(bookingMessage(b,type))}`,"_blank","noopener,noreferrer");
}

function openAdminEmail(b,action="Review booking"){
  if(!ADMIN_EMAIL){
    alert("Admin email is not configured in config.js. You can still use WhatsApp and the web dashboard.");
    return;
  }
  const subject=`Jagdambaa Booking ${b.booking_id} — ${action}`;
  const body=[
    `Booking ID: ${b.booking_id}`,
    `Customer: ${b.customer_name}`,
    `Mobile: ${b.customer_phone}`,
    `Service: ${b.service}`,
    `Route: ${b.pickup} → ${b.destination}`,
    `Travel: ${b.travel_date} ${b.pickup_time}`,
    `Passengers: ${b.passengers}`,
    `Trip Type: ${b.trip_type}`,
    `Status: ${b.status}`,
    `Fare: ${b.fare??"Not set"}`,
    `Advance: ${b.advance??"Not set"}`,
    `Balance: ${b.balance??"Not set"}`,
    `Notes: ${b.notes||"None"}`,
    "",
    "Please open the Admin Dashboard to approve/update this booking."
  ].join("\n");
  window.location.href=`mailto:${encodeURIComponent(ADMIN_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function approve(id){
  const b=find(id);if(!b)return;
  if(b.fare==null||b.fare===""){openEdit(id);alert("Enter the final fare before approving.");return}
  const ok=await update(id,{status:"Advance Pending"});
  if(ok){openWhatsApp({...b,status:"Advance Pending"},"quote");openAdminEmail({...b,status:"Advance Pending"},"Quote approved")}
}

async function reject(id){
  const b=find(id);if(!b)return;
  const reason=prompt("Reason for rejection (optional):","Vehicle unavailable");
  if(reason===null)return;
  const next={...b,status:"Cancelled",notes:reason};
  if(await update(id,{status:"Cancelled",notes:reason})){openWhatsApp(next,"rejected");openAdminEmail(next,"Booking rejected")}
}

async function confirmPayment(id){
  const b=find(id);if(!b)return;
  const advance=b.advance;
  if(advance==null||advance===""){
    openEdit(id);alert("Enter the received advance amount before confirming payment.");return;
  }
  const ok=await update(id,{status:"Confirmed"});
  if(ok){const n={...b,status:"Confirmed"};openWhatsApp(n,"confirmed");openAdminEmail(n,"Payment verified / booking confirmed")}
}

async function complete(id){
  const b=find(id);if(!b)return;
  const ok=await update(id,{status:"Completed"});
  if(ok){const n={...b,status:"Completed"};openWhatsApp(n,"completed");}
}

async function saveEdit(e){
  e.preventDefault();
  const f=new FormData(e.target),id=f.get("booking_id");
  const fare=f.get("fare")?Number(f.get("fare")):null;
  const advance=f.get("advance")?Number(f.get("advance")):null;
  const balance=f.get("balance")?Number(f.get("balance")):(fare!=null&&advance!=null?fare-advance:null);
  const patch={status:f.get("status"),fare,advance,balance,customer_name:f.get("customer_name"),customer_phone:f.get("customer_phone"),notes:f.get("notes")};
  if(await update(id,patch))$("#modal").classList.remove("open");
}

function exportCsv(){
  const cols=["booking_id","customer_name","customer_phone","service","pickup","destination","travel_date","pickup_time","passengers","trip_type","status","fare","advance","balance","notes"];
  const csv=[cols.join(","),...rows.map(r=>cols.map(c=>`"${String(r[c]??"").replaceAll('"','""')}"`).join(","))].join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="jagdambaa-bookings-v14.csv";a.click();URL.revokeObjectURL(a.href);
}

async function showDashboard(){
  $("#loginView").hidden=true;$("#dashboardView").hidden=false;$("#logout").hidden=false;
  await load();
}

async function login(e){
  e.preventDefault();
  const id=$("#email").value.trim(),pass=$("#password").value;
  $("#loginMsg").textContent="";
  if(CLOUD){
    try{
      const {data,error}=await sb.auth.signInWithPassword({email:id,password:pass});
      if(error)throw error;
      sessionStorage.setItem(SESSION,"cloud");
      await showDashboard();
    }catch(err){$("#loginMsg").textContent="Cloud login failed: "+(err.message||err)}
  }else if(id===DEMO_USER&&pass===DEMO_PASS){
    sessionStorage.setItem(SESSION,"local");
    await showDashboard();
  }else $("#loginMsg").textContent="Incorrect username or password.";
}

async function logout(){
  if(CLOUD){try{await sb.auth.signOut()}catch{}}
  sessionStorage.removeItem(SESSION);$("#dashboardView").hidden=true;$("#loginView").hidden=false;$("#logout").hidden=true;
}

function setupMode(){
  const badge=$("#modeBadge");
  if(CLOUD){
    badge.textContent="☁ Cloud / Supabase";badge.classList.add("v14-cloud");
    $("#demoCredentials").hidden=true;
    $("#loginDescription").textContent="Sign in with the Supabase admin account configured for this project.";
  }else{
    badge.textContent="⚠ Local prototype";badge.classList.add("v14-local");
  }
}

$("#loginForm").addEventListener("submit",login);
$("#logout").onclick=logout;
$("#refresh").onclick=load;
$("#demo").onclick=seedDemo;
$("#search").oninput=render;$("#filter").onchange=render;$("#dateFilter").onchange=render;
$("#reset").onclick=()=>{$("#search").value="";$("#filter").value="All";$("#dateFilter").value="";render()};
$("#export").onclick=exportCsv;
$("#close").onclick=$("#cancel").onclick=()=>$("#modal").classList.remove("open");
$("#editForm").addEventListener("submit",saveEdit);

$("#tbody").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  const id=b.dataset.edit||b.dataset.approve||b.dataset.reject||b.dataset.confirm||b.dataset.complete||b.dataset.wa||b.dataset.email;
  if(b.dataset.edit)openEdit(id);
  else if(b.dataset.approve)approve(id);
  else if(b.dataset.reject)reject(id);
  else if(b.dataset.confirm)confirmPayment(id);
  else if(b.dataset.complete)complete(id);
  else if(b.dataset.wa){const x=find(id);if(x)openWhatsApp(x,x.status==="Confirmed"?"confirmed":x.status==="Completed"?"completed":x.status==="Cancelled"?"rejected":"quote")}
  else if(b.dataset.email){const x=find(id);if(x)openAdminEmail(x,"Review booking")}
});

$("#notifyAll").onclick=()=>{
  const pending=rows.filter(x=>x.status==="Enquiry");
  if(!pending.length){alert("No pending enquiries.");return}
  const x=pending[0];
  openWhatsApp(x,"quote");
  if(ADMIN_EMAIL)openAdminEmail(x,"Pending enquiry");
};

(async function(){
  setupMode();
  if(CLOUD){
    try{
      const {data}=await sb.auth.getSession();
      if(data.session){sessionStorage.setItem(SESSION,"cloud");await showDashboard();}
    }catch(e){console.warn(e)}
  }else if(sessionStorage.getItem(SESSION)==="local")await showDashboard();
})();
})();