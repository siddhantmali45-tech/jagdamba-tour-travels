
const WHATSAPP="919067620231";
const wa=(msg="Hello Jagdambaa Tours & Travels, I would like to enquire about a booking.")=>`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

["heroWhatsApp","contactWhatsApp","stickyWhatsApp"].forEach(id=>{const el=document.getElementById(id);if(el)el.href=wa();});
const menu=document.getElementById("menu"),nav=document.getElementById("navLinks");
menu?.addEventListener("click",()=>nav.classList.toggle("open"));
nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

document.querySelectorAll(".choice input").forEach(input=>input.addEventListener("change",()=>{
  document.querySelectorAll(".choice").forEach(c=>c.classList.remove("active"));
  input.closest(".choice").classList.add("active");
}));

const form=document.getElementById("bookingForm");
const steps=[...document.querySelectorAll("#bookingSteps button")];
const panels=[...document.querySelectorAll(".booking-panel")];
let currentStep=1;
let booking={};

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function get(name){return form?.elements[name]?.value||"";}
function id(){
  const d=new Date();
  return `JT-${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(100+Math.random()*900)}`;
}
function setStep(n){
  currentStep=n;
  panels.forEach(p=>p.classList.toggle("active",Number(p.dataset.panel)===n));
  steps.forEach(b=>{
    const s=Number(b.dataset.step);
    b.classList.toggle("active",s===n);
    b.classList.toggle("done",s<n);
  });
}
function validatePanel(n){
  const fields=[...document.querySelectorAll(`.booking-panel[data-panel="${n}"] [required]`)];
  const bad=fields.find(f=>!f.checkValidity());
  if(bad){bad.reportValidity();return false;}
  return true;
}
function buildBooking(){
  booking={
    id:id(),service:get("service"),pickup:get("pickup"),destination:get("destination"),
    date:get("date"),time:get("time"),passengers:get("passengers"),tripType:get("tripType"),
    returnDate:get("returnDate")||"N/A",luggage:get("luggage"),name:get("name"),phone:get("phone"),
    notes:get("notes")||"None",status:"Enquiry",fare:"",advance:"",balance:"",
    createdAt:new Date().toISOString()
  };
  const rows=[
    ["Booking ID",booking.id],["Service",booking.service],["Pickup",booking.pickup],
    ["Destination",booking.destination],["Travel Date",booking.date],["Pickup Time",booking.time],
    ["Passengers",booking.passengers],["Trip Type",booking.tripType],["Return Date",booking.returnDate],
    ["Luggage",booking.luggage],["Name",booking.name],["Mobile",booking.phone],["Requirements",booking.notes]
  ];
  document.getElementById("inlineReview").innerHTML=rows.map(([k,v])=>`<div class="review-item"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join("");
}
function saveBooking(){
  const key="jagdambaaBookings";
  const list=JSON.parse(localStorage.getItem(key)||"[]");
  list.unshift(booking);
  localStorage.setItem(key,JSON.stringify(list));
}
function showSuccess(){
  const box=document.getElementById("bookingSuccess");
  box.innerHTML=`Booking enquiry <b>${esc(booking.id)}</b> is ready. WhatsApp will open with your complete request.`;
  box.style.display="block";
}
steps.forEach(btn=>btn.addEventListener("click",()=>{
  const target=Number(btn.dataset.step);
  if(target===1){setStep(1);return;}
  if(target===2){if(validatePanel(1))setStep(2);return;}
  if(target===3){if(validatePanel(1)&&validatePanel(2)){buildBooking();setStep(3);return;}}
}));
document.querySelectorAll(".next-step").forEach(btn=>btn.addEventListener("click",()=>{
  const next=Number(btn.dataset.next);
  if(next===2&&validatePanel(1))setStep(2);
  if(next===3&&validatePanel(2)){buildBooking();setStep(3);}
}));
document.querySelectorAll(".prev-step").forEach(btn=>btn.addEventListener("click",()=>setStep(Number(btn.dataset.prev))));

form?.addEventListener("submit",e=>{
  e.preventDefault();
  if(!validatePanel(1)||!validatePanel(2))return;
  if(!booking.id)buildBooking();
  saveBooking();
  const msg=[
    "🚗 *NEW BOOKING REQUEST — JAGDAMBAA TOURS & TRAVELS*","",
    `🆔 Booking ID: ${booking.id}`,`👤 Name: ${booking.name}`,`📞 Mobile: ${booking.phone}`,
    `🚘 Service: ${booking.service}`,`📍 Pickup: ${booking.pickup}`,`📍 Destination: ${booking.destination}`,
    `📅 Travel Date: ${booking.date}`,`⏰ Pickup Time: ${booking.time}`,`👥 Passengers: ${booking.passengers}`,
    `🧭 Trip Type: ${booking.tripType}`,`🔄 Return Date: ${booking.returnDate}`,`🧳 Luggage: ${booking.luggage}`,
    `📝 Requirements: ${booking.notes}`,"","Please confirm availability and quotation."
  ].join("\n");
  showSuccess();
  window.open(wa(msg),"_blank","noopener,noreferrer");
});

const travelDate=document.querySelector('input[name="date"]'),returnDate=document.querySelector('input[name="returnDate"]');
if(travelDate){
  const d=new Date();
  travelDate.min=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  travelDate.addEventListener("change",()=>{if(returnDate)returnDate.min=travelDate.value;});
}
document.querySelector('input[name="phone"]')?.addEventListener("input",e=>e.target.value=e.target.value.replace(/\D/g,"").slice(0,10));

// V9 discovery: popular route buttons prefill pickup/destination.
document.querySelectorAll(".route-grid button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const value=btn.dataset.route||"";
    const parts=value.split(" → ");
    const pickup=document.querySelector('input[name="pickup"]');
    const destination=document.querySelector('input[name="destination"]');
    if(pickup && destination && parts.length===2){
      pickup.value=parts[0]; destination.value=parts[1];
    } else if(destination){
      destination.value=value;
    }
    document.querySelector("#booking")?.scrollIntoView({behavior:"smooth",block:"center"});
    setTimeout(()=>document.querySelector('input[name="date"]')?.focus(),500);
  });
});

// V10: copy UPI ID helper
const upiLine=document.querySelector(".upi-line span");
if(upiLine){
  const copyBtn=document.createElement("button");
  copyBtn.type="button";
  copyBtn.className="admin-btn";
  copyBtn.textContent="Copy UPI";
  copyBtn.style.marginLeft="4px";
  copyBtn.addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(upiLine.textContent.trim());copyBtn.textContent="Copied ✓";setTimeout(()=>copyBtn.textContent="Copy UPI",1500);}
    catch(e){alert("UPI ID: "+upiLine.textContent.trim());}
  });
  upiLine.parentElement.appendChild(copyBtn);
}
