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
const activeMissionSection = document.getElementById("activeMissionSection");
const activeMissionTitle = document.getElementById("activeMissionTitle");
const activeMissionDescription = document.getElementById("activeMissionDescription");
const resumeMissionBtn = document.getElementById("resumeMissionBtn");

let activeMissionData = null;

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

function getMissionId(mission) {
    return mission._id || mission.id;
}

function saveActiveMission(activePayload) {
    if (!activePayload || !activePayload.mission || !activePayload.userMission) {
        return;
    }

    sessionStorage.setItem("activeMission", JSON.stringify(activePayload));
}

function resumeActiveMission() {
    if (!activeMissionData) {
        setStatus("Nessuna missione attiva da riprendere.", true);
        return;
    }

    saveActiveMission(activeMissionData);
    window.location.href = "/mission/start_mission";
}

function renderActiveMission(activePayload) {
    activeMissionData = activePayload;

    if (!activePayload || !activePayload.mission) {
        activeMissionSection.classList.add("hidden");
        return;
    }

    activeMissionTitle.textContent = formatTitle(activePayload.mission.titolo);
    activeMissionDescription.textContent = activePayload.mission.descrizione || "Hai una missione in corso.";
    activeMissionSection.classList.remove("hidden");
}

async function loadActiveMission(token) {
    const response = await fetch("/mission/active", {
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
    renderActiveMission(json.active ? json.data : null);
}

async function startMission(mission, button) {
    const token = localStorage.getItem("token");
    const missionId = getMissionId(mission);

    if (!token) {
        setStatus("Devi effettuare il login per avviare una missione.", true);
        return;
    }

    if (activeMissionData) {
        setStatus("Hai già una missione in corso. Riprendila o completala prima di iniziarne un'altra.", true);
        return;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Avvio...";

    try {
        const body = missionId
            ? { missionId }
            : {
                missionData: {
                    titolo: mission.titolo,
                    descrizione: mission.descrizione,
                    arrayPOI: mission.arrayPOI,
                    punti: mission.punti,
                    bonusGamification: mission.bonusGamification,
                    risparmioCO2: mission.risparmioCO2,
                    stato: mission.stato
                }
            };

        const response = await fetch("/mission/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 409 && data.active) {
                renderActiveMission(data.active);
                saveActiveMission(data.active);
            }
            throw new Error(data.message || `Errore HTTP ${response.status}`);
        }

        saveActiveMission({
            mission: {
                ...mission,
                _id: data.missionId || missionId
            },
            userMission: data
        });

        window.location.href = "/mission/start_mission";
    } catch (error) {
        button.disabled = false;
        button.textContent = originalText;
        setStatus(error.message || "Non riesco ad avviare la missione.", true);
        console.error("Errore avvio missione:", error);
    }
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
            <button type="button" class="start-mission-btn">Avvia</button>
        </div>
    `;

    const startButton = card.querySelector(".start-mission-btn");
    if (activeMissionData) {
        startButton.disabled = true;
        startButton.textContent = "Missione in corso";
    }
    startButton.addEventListener("click", () => startMission(mission, startButton));

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
        renderActiveMission(null);
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
        await loadActiveMission(token);

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
resumeMissionBtn.addEventListener("click", resumeActiveMission);

updateLocationText();
loadMissions();
