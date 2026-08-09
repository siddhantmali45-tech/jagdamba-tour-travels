(function () {
"use strict";

const C = window.JAG_CONFIG || {};
const HAS_CLOUD = !!(
  window.supabase &&
  C.SUPABASE_URL &&
  C.SUPABASE_ANON_KEY &&
  !C.SUPABASE_URL.includes("YOUR-PROJECT") &&
  !C.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")
);
const sb = HAS_CLOUD
  ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY)
  : null;

const WHATSAPP = "919067620231";
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[c]));
const wa = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

["heroWhatsApp","contactWhatsApp","stickyWhatsApp"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.href = wa("Hello Jagdambaa Tours & Travels, I would like to enquire about a booking.");
});

const menu = $("#menu");
const nav = $("#navLinks");
menu?.addEventListener("click", () => nav.classList.toggle("open"));
nav?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

document.querySelectorAll(".choice input").forEach(input => {
  input.addEventListener("change", () => {
    document.querySelectorAll(".choice").forEach(c => c.classList.remove("active"));
    input.closest(".choice").classList.add("active");
  });
});

const form = $("#bookingForm");
const steps = [...document.querySelectorAll("#bookingSteps button")];
const panels = [...document.querySelectorAll(".booking-panel")];
let booking = {};
let sending = false;

function get(name) {
  return form?.elements[name]?.value || "";
}

function makeBookingId() {
  const d = new Date();
  return `JT-${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(100 + Math.random()*900)}`;
}

function setStep(n) {
  panels.forEach(p => p.classList.toggle("active", Number(p.dataset.panel) === n));
  steps.forEach(b => {
    const s = Number(b.dataset.step);
    b.classList.toggle("active", s === n);
    b.classList.toggle("done", s < n);
  });
}

function validatePanel(n) {
  const fields = [...document.querySelectorAll(`.booking-panel[data-panel="${n}"] [required]`)];
  const bad = fields.find(f => !f.checkValidity());
  if (bad) {
    bad.reportValidity();
    return false;
  }
  return true;
}

function buildBooking() {
  booking = {
    booking_id: makeBookingId(),
    service: get("service"),
    pickup: get("pickup"),
    destination: get("destination"),
    travel_date: get("date"),
    pickup_time: get("time"),
    passengers: Number(get("passengers")),
    trip_type: get("tripType"),
    return_date: get("returnDate") || null,
    luggage: get("luggage"),
    customer_name: get("name"),
    customer_phone: get("phone"),
    notes: get("notes") || null,
    status: "Enquiry",
    fare: null,
    advance: null,
    balance: null
  };

  const rows = [
    ["Booking ID", booking.booking_id],
    ["Service", booking.service],
    ["Pickup", booking.pickup],
    ["Destination", booking.destination],
    ["Travel Date", booking.travel_date],
    ["Pickup Time", booking.pickup_time],
    ["Passengers", booking.passengers],
    ["Trip Type", booking.trip_type],
    ["Return Date", booking.return_date || "N/A"],
    ["Luggage", booking.luggage],
    ["Name", booking.customer_name],
    ["Mobile", booking.customer_phone],
    ["Requirements", booking.notes || "None"]
  ];

  const box = $("#inlineReview");
  if (box) {
    box.innerHTML = rows.map(([k,v]) =>
      `<div class="review-item"><small>${esc(k)}</small><b>${esc(v)}</b></div>`
    ).join("");
  }
}

function saveLocal() {
  const key = "jagdambaaBookings";
  const list = JSON.parse(localStorage.getItem(key) || "[]");
  list.unshift({
    ...booking,
    id: booking.booking_id,
    date: booking.travel_date,
    time: booking.pickup_time,
    name: booking.customer_name,
    phone: booking.customer_phone,
    created_at: new Date().toISOString()
  });
  localStorage.setItem(key, JSON.stringify(list));
}

async function saveCloud() {
  if (!sb) return false;
  const { error } = await sb.from("bookings").insert(booking);
  if (error) throw error;
  return true;
}

function showSuccess(message, type="ok") {
  const box = $("#bookingSuccess");
  if (!box) return;
  box.className = `booking-success v8-success ${type}`;
  box.innerHTML = message;
  box.style.display = "block";
}

steps.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = Number(btn.dataset.step);
    if (target === 1) setStep(1);
    else if (target === 2 && validatePanel(1)) setStep(2);
    else if (target === 3 && validatePanel(1) && validatePanel(2)) {
      buildBooking();
      setStep(3);
    }
  });
});

document.querySelectorAll(".next-step").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = Number(btn.dataset.next);
    if (target === 2 && validatePanel(1)) setStep(2);
    if (target === 3 && validatePanel(2)) {
      buildBooking();
      setStep(3);
    }
  });
});

document.querySelectorAll(".prev-step").forEach(btn => {
  btn.addEventListener("click", () => setStep(Number(btn.dataset.prev)));
});

form?.addEventListener("submit", async e => {
  e.preventDefault();
  if (sending || !validatePanel(1) || !validatePanel(2)) return;

  if (!booking.booking_id) buildBooking();

  sending = true;
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = true;

  let cloudSaved = false;

  try {
    if (HAS_CLOUD) {
      try {
        cloudSaved = await saveCloud();
      } catch (error) {
        console.error("Supabase booking error:", error);
        saveLocal();
        showSuccess(
          `Booking <b>${esc(booking.booking_id)}</b> was saved locally because cloud saving failed. WhatsApp will still open.`,
          "warning"
        );
      }
    } else {
      saveLocal();
    }

    if (cloudSaved) {
      showSuccess(
        `Booking <b>${esc(booking.booking_id)}</b> has been submitted successfully. WhatsApp will open next.<br><a class="status-link" href="booking-status.html">Check booking status →</a>`,
        "ok"
      );
    } else if (!HAS_CLOUD) {
      showSuccess(
        `Booking <b>${esc(booking.booking_id)}</b> is ready. WhatsApp will open next.<br><a class="status-link" href="booking-status.html">Check booking status →</a>`,
        "ok"
      );
    }

    const msg = [
      "🚗 *NEW BOOKING REQUEST — JAGDAMBAA TOURS & TRAVELS*",
      "",
      `🆔 Booking ID: ${booking.booking_id}`,
      `👤 Name: ${booking.customer_name}`,
      `📞 Mobile: ${booking.customer_phone}`,
      `🚘 Service: ${booking.service}`,
      `📍 Pickup: ${booking.pickup}`,
      `📍 Destination: ${booking.destination}`,
      `📅 Travel Date: ${booking.travel_date}`,
      `⏰ Pickup Time: ${booking.pickup_time}`,
      `👥 Passengers: ${booking.passengers}`,
      `🧭 Trip Type: ${booking.trip_type}`,
      `🔄 Return Date: ${booking.return_date || "N/A"}`,
      `🧳 Luggage: ${booking.luggage}`,
      `📝 Requirements: ${booking.notes || "None"}`,
      "",
      "Please confirm availability and quotation."
    ].join("\n");

    window.open(wa(msg), "_blank", "noopener,noreferrer");
  } finally {
    setTimeout(() => {
      sending = false;
      if (button) button.disabled = false;
    }, 1500);
  }
});

const travelDate = $('input[name="date"]');
const returnDate = $('input[name="returnDate"]');

if (travelDate) {
  const d = new Date();
  travelDate.min = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  travelDate.addEventListener("change", () => {
    if (returnDate) returnDate.min = travelDate.value;
  });
}

$('input[name="phone"]')?.addEventListener("input", e => {
  e.target.value = e.target.value.replace(/\D/g,"").slice(0,10);
});

document.querySelectorAll(".route-grid button").forEach(btn => {
  btn.addEventListener("click", () => {
    const parts = (btn.dataset.route || "").split(" → ");
    const pickup = $('input[name="pickup"]');
    const destination = $('input[name="destination"]');

    if (parts.length === 2) {
      pickup.value = parts[0];
      destination.value = parts[1];
    } else {
      destination.value = btn.dataset.route || "";
    }

    $("#booking")?.scrollIntoView({behavior:"smooth", block:"center"});
    setTimeout(() => $('input[name="date"]')?.focus(), 400);
  });
});

const upiLine = $(".upi-line span");
if (upiLine) {
  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "admin-btn";
  copy.textContent = "Copy UPI";
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(upiLine.textContent.trim());
      copy.textContent = "Copied ✓";
      setTimeout(() => copy.textContent = "Copy UPI", 1500);
    } catch {
      alert("UPI ID: " + upiLine.textContent.trim());
    }
  });
  upiLine.parentElement.appendChild(copy);
}

window.JAG_V11 = { cloudEnabled: HAS_CLOUD };
})();