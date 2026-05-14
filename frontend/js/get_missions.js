const defaultPosition = {
    latitudine: 46.066423,
    longitudine: 11.125760,
    label: "Trento"
};

let currentPosition = { ...defaultPosition };

const missionsList = document.getElementById("missionsList");
const statusMessage = document.getElementById("statusMessage");
const totalCount = document.getElementById("totalCount");
const predefinedCount = document.getElementById("predefinedCount");
const dynamicCount = document.getElementById("dynamicCount");
const locationText = document.getElementById("locationText");
const refreshBtn = document.getElementById("refreshBtn");
const useLocationBtn = document.getElementById("useLocationBtn");

function setStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("error", isError);
    statusMessage.classList.remove("hidden");
}

function hideStatus() {
    statusMessage.classList.add("hidden");
}

function updateLocationText() {
    locationText.textContent = `Posizione: ${currentPosition.label}`;
}

function formatTitle(title) {
    if (!title) {
        return "Missione";
    }

    return title
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatCO2(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return null;
    }

    return `${number.toFixed(1)} kg CO2`;
}

function getFirstPoint(mission) {
    return Array.isArray(mission.arrayPOI) && mission.arrayPOI.length > 0
        ? mission.arrayPOI[0]
        : null;
}

function createAppMapLink(point) {
    if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
        return "";
    }

    const params = new URLSearchParams({
        latitudine: point.lat,
        longitudine: point.lng,
        focusPoi: "true"
    });
    const url = `/home/homepage?${params.toString()}`;
    return `<a class="maps-link" href="${url}">Apri mappa</a>`;
}

function createMissionCard(mission) {
    const card = document.createElement("article");
    card.className = "mission-card";

    const type = mission.predefinita ? "Predefinita" : "Dinamica";
    const co2 = formatCO2(mission.risparmioCO2);
    const point = getFirstPoint(mission);
    const title = escapeHtml(formatTitle(mission.titolo));
    const description = escapeHtml(mission.descrizione || "Completa questa missione per guadagnare punti EcoQuest.");
    const status = escapeHtml(mission.stato || "DaIniziare");
    const points = Number.isFinite(Number(mission.punti)) ? Number(mission.punti) : 0;
    const bonus = Number.isFinite(Number(mission.bonusGamification)) ? Number(mission.bonusGamification) : null;

    card.innerHTML = `
        <div class="mission-topline">
            <span class="mission-type ${mission.predefinita ? "" : "dynamic"}">${type}</span>
            <span class="mission-points">${points} pt</span>
        </div>
        <h2>${title}</h2>
        <p>${description}</p>
        <div class="mission-meta">
            <span>${status}</span>
            ${co2 ? `<span>${co2}</span>` : ""}
            ${bonus ? `<span>Bonus ${bonus}</span>` : ""}
        </div>
        <div class="mission-actions">
            ${createAppMapLink(point)}
        </div>
    `;

    return card;
}

function renderSummary(missions) {
    const predefined = missions.filter((mission) => mission.predefinita);
    const dynamic = missions.filter((mission) => !mission.predefinita);

    totalCount.textContent = missions.length;
    predefinedCount.textContent = predefined.length;
    dynamicCount.textContent = dynamic.length;
}

function renderMissions(missions) {
    missionsList.innerHTML = "";
    renderSummary(missions);

    if (missions.length === 0) {
        setStatus("Nessuna missione disponibile per questa posizione.");
        return;
    }

    hideStatus();
    missions.forEach((mission) => {
        missionsList.appendChild(createMissionCard(mission));
    });
}

async function loadMissions() {
    const token = localStorage.getItem("token");

    if (!token) {
        renderSummary([]);
        missionsList.innerHTML = "";
        setStatus("Devi effettuare il login per generare le missioni.", true);
        return;
    }

    setStatus("Caricamento missioni...");
    missionsList.innerHTML = "";

    const params = new URLSearchParams({
        latitudine: currentPosition.latitudine,
        longitudine: currentPosition.longitudine
    });

    try {
        const response = await fetch(`/mission/listaMissioni?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            throw new Error("Token non valido o scaduto");
        }

        if (!response.ok) {
            throw new Error(`Errore HTTP ${response.status}`);
        }

        const json = await response.json();
        renderMissions(json.dati || []);
    } catch (error) {
        renderSummary([]);
        const message = error.message === "Token non valido o scaduto"
            ? "Sessione scaduta: effettua di nuovo il login."
            : "Non riesco a caricare le missioni. Riprova tra poco.";
        setStatus(message, true);
        console.error("Errore nel recupero delle missioni:", error);
    }
}

function useBrowserLocation() {
    if (!navigator.geolocation) {
        setStatus("Geolocalizzazione non disponibile nel browser.", true);
        return;
    }

    setStatus("Recupero posizione...");

    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentPosition = {
                latitudine: position.coords.latitude,
                longitudine: position.coords.longitude,
                label: "posizione attuale"
            };
            updateLocationText();
            loadMissions();
        },
        () => {
            currentPosition = { ...defaultPosition };
            updateLocationText();
            setStatus("Uso Trento come posizione predefinita.", true);
            loadMissions();
        },
        {
            enableHighAccuracy: true,
            timeout: 7000,
            maximumAge: 60000
        }
    );
}

refreshBtn.addEventListener("click", loadMissions);
useLocationBtn.addEventListener("click", useBrowserLocation);

updateLocationText();
loadMissions();
