(function(){
"use strict";
const C=window.JAG_CONFIG||{};
const CLOUD=!!(window.supabase&&C.SUPABASE_URL&&C.SUPABASE_ANON_KEY&&!C.SUPABASE_URL.includes("YOUR-PROJECT")&&!C.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE"));
const sb=CLOUD?window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY):null;
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const KEY="jagdambaaBookings";

async function lookupStatus(id,phone){
  if(CLOUD){
    const {data,error}=await sb.from("booking_public_status").select("*").eq("booking_id",id).eq("customer_phone",phone).maybeSingle();
    if(error) throw error;
    return data;
  }
  const list=JSON.parse(localStorage.getItem(KEY)||"[]");
  return list.find(x=>(x.booking_id||x.id)===id&&(x.customer_phone||x.phone)===phone)||null;
}

window.JAG_V12={cloud:CLOUD,lookupStatus};
})();