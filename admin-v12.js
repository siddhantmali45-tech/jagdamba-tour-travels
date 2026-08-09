(function(){
"use strict";
const C=window.JAG_CONFIG||{};
const CLOUD=!!(window.supabase&&C.SUPABASE_URL&&C.SUPABASE_ANON_KEY&&!C.SUPABASE_URL.includes("YOUR-PROJECT")&&!C.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE"));
const sb=CLOUD?window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY):null;
const KEY="jagdambaaBookings";
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let rows=[];

function localLoad(){return JSON.parse(localStorage.getItem(KEY)||"[]")}
function localSave(x){localStorage.setItem(KEY,JSON.stringify(x))}
function statusClass(s){return "status-"+String(s||"").toLowerCase().replaceAll(" ","-")}

async function load(){
 if(CLOUD){
   const {data,error}=await sb.from("bookings").select("*").order("created_at",{ascending:false});
   if(error){alert(error.message);return}
   rows=data||[];
 }else rows=localLoad();
 render();
}

function render(){
 const q=$("#search").value.toLowerCase(), f=$("#filter").value, d=$("#dateFilter").value;
 const list=rows.filter(b=>{
   const text=[b.booking_id,b.customer_name,b.customer_phone,b.pickup,b.destination].join(" ").toLowerCase();
   return (f==="All"||b.status===f)&&(!d||b.travel_date===d)&&(!q||text.includes(q));
 });
 const stats=[["Total",rows.length],["Enquiry",rows.filter(x=>x.status==="Enquiry").length],["Quoted",rows.filter(x=>x.status==="Quoted").length],["Advance Pending",rows.filter(x=>x.status==="Advance Pending").length],["Confirmed",rows.filter(x=>x.status==="Confirmed").length]];
 $("#stats").innerHTML=stats.map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("");
 $("#tbody").innerHTML=list.length?list.map(b=>`<tr>
 <td><b>${esc(b.booking_id)}</b><small>${b.created_at?new Date(b.created_at).toLocaleString():""}</small></td>
 <td><b>${esc(b.customer_name)}</b><small>${esc(b.customer_phone)}</small></td>
 <td><b>${esc(b.pickup)} → ${esc(b.destination)}</b><small>${esc(b.trip_type)}</small></td>
 <td><b>${esc(b.travel_date)}</b><small>${esc(b.pickup_time)}</small></td>
 <td>${esc(b.service)}</td>
 <td><b>${b.fare?`₹${b.fare}`:"—"}</b>${b.advance?`<small>Adv ₹${b.advance} • Bal ₹${b.balance??"—"}</small>`:""}</td>
 <td><span class="status ${statusClass(b.status)}">${esc(b.status)}</span></td>
 <td><div class="row-actions"><button data-edit="${esc(b.booking_id)}">Edit</button><button data-approve="${esc(b.booking_id)}">Approve</button><button data-reject="${esc(b.booking_id)}">Reject</button><button data-wa="${esc(b.booking_id)}">WhatsApp</button></div></td>
 </tr>`).join(""):`<tr><td colspan="8" class="empty">No bookings found.</td></tr>`;
}

function openEdit(id){
 const b=rows.find(x=>x.booking_id===id);if(!b)return;
 [["booking_id",b.booking_id],["status",b.status],["fare",b.fare??""],["advance",b.advance??""],["balance",b.balance??""],["customer_name",b.customer_name],["customer_phone",b.customer_phone],["notes",b.notes||""]].forEach(([k,v])=>{const e=$(`#editForm [name="${k}"]`);if(e)e.value=v});
 $("#modal").classList.add("open");
}

async function update(id,patch){
 if(CLOUD){
  const {error}=await sb.from("bookings").update(patch).eq("booking_id",id);
  if(error){alert(error.message);return false}
 }else{
  const i=rows.findIndex(x=>x.booking_id===id);if(i<0)return false;
  rows[i]={...rows[i],...patch};localSave(rows);
 }
 await load(); return true;
}

async function approve(id){
 const b=rows.find(x=>x.booking_id===id);if(!b)return;
 if(!b.fare){openEdit(id);alert("Enter the final fare before approving.");return}
 const ok=await update(id,{status:"Advance Pending"});
 if(ok) notifyCustomer(b,"quote");
}

async function reject(id){
 const b=rows.find(x=>x.booking_id===id);if(!b)return;
 const reason=prompt("Reason for rejection (optional):","Vehicle unavailable");
 if(reason===null)return;
 const ok=await update(id,{status:"Cancelled",notes:reason});
 if(ok) notifyCustomer({...b,notes:reason,status:"Cancelled"},"rejected");
}

function notifyCustomer(b,type){
 const phone=String(b.customer_phone||"").replace(/\D/g,"");
 if(phone.length!==10)return;
 let msg="";
 if(type==="quote")msg=`Hello ${b.customer_name}, your Jagdambaa Tours & Travels request ${b.booking_id} has been approved for quotation. Fare: ₹${b.fare}. Advance: ₹${b.advance||"To be confirmed"}. Please reply to proceed with payment.`;
 else msg=`Hello ${b.customer_name}, your Jagdambaa Tours & Travels request ${b.booking_id} could not be accepted at this time. Reason: ${b.notes||"Unavailable"}.`;
 window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`,"_blank");
}

async function saveEdit(e){
 e.preventDefault();const f=new FormData(e.target),id=f.get("booking_id");
 const fare=f.get("fare")?Number(f.get("fare")):null,advance=f.get("advance")?Number(f.get("advance")):null;
 const patch={status:f.get("status"),fare,advance,balance:f.get("balance")?Number(f.get("balance")):(fare!=null&&advance!=null?fare-advance:null),customer_name:f.get("customer_name"),customer_phone:f.get("customer_phone"),notes:f.get("notes")};
 if(await update(id,patch))$("#modal").classList.remove("open");
}

function exportCsv(){
 const cols=["booking_id","customer_name","customer_phone","service","pickup","destination","travel_date","pickup_time","passengers","trip_type","status","fare","advance","balance","notes"];
 const csv=[cols.join(","),...rows.map(r=>cols.map(c=>`"${String(r[c]??"").replaceAll('"','""')}"`).join(","))].join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="jagdambaa-bookings.csv";a.click();
}

$("#refresh").onclick=load;
$("#search").oninput=render;$("#filter").onchange=render;$("#dateFilter").onchange=render;
$("#reset").onclick=()=>{$("#search").value="";$("#filter").value="All";$("#dateFilter").value="";render()};
$("#export").onclick=exportCsv;
$("#close").onclick=$("#cancel").onclick=()=>$("#modal").classList.remove("open");
$("#editForm").addEventListener("submit",saveEdit);
$("#tbody").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.edit)openEdit(b.dataset.edit);if(b.dataset.approve)approve(b.dataset.approve);if(b.dataset.reject)reject(b.dataset.reject);if(b.dataset.wa){const x=rows.find(r=>r.booking_id===b.dataset.wa);if(x)notifyCustomer(x,"quote")}});
$("#notifyAll").onclick=()=>{rows.filter(x=>x.status==="Enquiry").slice(0,10).forEach(x=>notifyCustomer(x,"quote"))};
load();
})();