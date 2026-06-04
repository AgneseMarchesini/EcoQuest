/**
 * Gestisce la renderizzazione dinamica della pagina di dettaglio di una specifica attività commerciale. 
 * Recupera l'ID dell'attività dall'URL, interroga l'endpoint protetto (`/esercente/api/attivita/:id`) e popola 
 * l'interfaccia utente con tutte le informazioni pertinenti: stato di approvazione, orari di apertura, 
 * categorie, mappa interattiva (Leaflet) centrata sulle coordinate del locale e la lista dei coupon associati.
 */

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const detailContent = document.getElementById("detailContent");
const activityName = document.getElementById("activityName");
const activityDescription = document.getElementById("activityDescription");
const approvalBadge = document.getElementById("approvalBadge");
const categoryList = document.getElementById("categoryList");
const hoursList = document.getElementById("hoursList");
const createCouponLink = document.getElementById("createCouponLink");
const latitudeText = document.getElementById("latitudeText");
const longitudeText = document.getElementById("longitudeText");
const couponCount = document.getElementById("couponCount");
const couponList = document.getElementById("couponList");

const dayLabels = {
    lunedi: "Lunedi",
    martedi: "Martedi",
    mercoledi: "Mercoledi",
    giovedi: "Giovedi",
    venerdi: "Venerdi",
    sabato: "Sabato",
    domenica: "Domenica"
};

function getActivityIdFromPath() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1];
}

function showError(message) {
    loadingState.hidden = true;
    detailContent.hidden = true;
    errorState.hidden = false;
    errorState.textContent = message;
}

function formatDate(value) {
    if (!value) {
        return "Nessuna scadenza";
    }

    return new Date(value).toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderCategories(categories = []) {
    categoryList.innerHTML = "";

    categories.forEach((category) => {
        const badge = document.createElement("span");
        badge.className = "category-badge";
        badge.textContent = category;
        categoryList.appendChild(badge);
    });
}

function renderHours(hours = {}) {
    hoursList.innerHTML = "";

    Object.entries(dayLabels).forEach(([dayKey, label]) => {
        const dayHours = hours[dayKey] || {};
        const row = document.createElement("div");
        row.className = "hour-row";

        const dayName = document.createElement("span");
        dayName.textContent = label;

        const value = document.createElement("strong");
        value.textContent = dayHours.aperto === false
            ? "Chiuso"
            : `${dayHours.apertura || "09:00"} - ${dayHours.chiusura || "19:00"}`;

        row.appendChild(dayName);
        row.appendChild(value);
        hoursList.appendChild(row);
    });
}

function renderMap(activity) {
    const coordinates = activity.posizione?.coordinates || [];
    const longitude = Number(coordinates[0]);
    const latitude = Number(coordinates[1]);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        document.getElementById("activityMap").textContent = "Coordinate non disponibili";
        return;
    }

    latitudeText.textContent = `Latitudine: ${latitude.toFixed(6)}`;
    longitudeText.textContent = `Longitudine: ${longitude.toFixed(6)}`;

    const map = L.map("activityMap", {
        scrollWheelZoom: false
    }).setView([latitude, longitude], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(activity.nomeAttivita)
        .openPopup();
}

function renderCoupons(coupons = []) {
    couponCount.textContent = coupons.length;
    couponList.innerHTML = "";

    if (coupons.length === 0) {
        couponList.innerHTML = `
            <div class="empty-coupons">
                Nessun coupon creato per questa attivita.
            </div>
        `;
        return;
    }

    coupons.forEach((coupon) => {
        const card = document.createElement("article");
        card.className = "coupon-card";

        const status = coupon.statoUtilizzo ? "Usato" : "Attivo";
        const statusClass = coupon.statoUtilizzo ? "used" : "active";

        card.innerHTML = `
            <div class="coupon-topline">
                <span class="coupon-category">${escapeHtml(coupon.categoria || "Coupon")}</span>
                <span class="coupon-status ${statusClass}">${status}</span>
            </div>
            <h4>${escapeHtml(coupon.titolo || "Coupon")}</h4>
            <p>${escapeHtml(coupon.descrizione || "Nessuna descrizione.")}</p>
            <div class="coupon-meta">
                <span>${coupon.costoInPunti || 0} punti</span>
                <span>Scade il ${formatDate(coupon.scadenza)}</span>
            </div>
            <code>${escapeHtml(coupon.codice || "")}</code>
        `;

        couponList.appendChild(card);
    });
}

function renderDetail(payload) {
    const { attivita, coupon } = payload;

    activityName.textContent = attivita.nomeAttivita;
    activityDescription.textContent = attivita.descrizione || "Nessuna descrizione disponibile.";
    approvalBadge.textContent = attivita.statoApprovazione ? "Approvata" : "In attesa di approvazione";
    approvalBadge.className = `approval-badge ${attivita.statoApprovazione ? "approved" : "pending"}`;
    createCouponLink.href = `/esercente/attivita/${attivita._id}/nuovo_coupon`;

    renderCategories(attivita.categoria || []);
    renderHours(attivita.orari || {});
    renderCoupons(coupon || []);

    loadingState.hidden = true;
    detailContent.hidden = false;

    renderMap(attivita);
}

async function loadActivityDetail() {
    if (!checkPageAuth(["Esercente", "Amministratore"])) {
        return;
    }

    const activityId = getActivityIdFromPath();

    if (!activityId) {
        showError("Attivita non valida.");
        return;
    }

    try {
        const response = await fetch(`/esercente/api/attivita/${activityId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (redirectToLoginIfUnauthorized(response)) {
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Impossibile caricare il dettaglio dell'attivita.");
        }

        renderDetail(data);
    } catch (error) {
        console.error("Errore dettaglio attivita:", error);
        showError(error.message || "Errore di connessione.");
    }
}

document.addEventListener("DOMContentLoaded", loadActivityDetail);
