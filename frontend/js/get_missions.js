const bike_factor = 0.9
const car_factor = 0.5
const defaultPosition = {
    latitudine: 46.066423,
    longitudine: 11.125760,
    label: "Trento"
};

let currentPosition = { ...defaultPosition };

let map = null;
let routingControl = null;

const transportModeSelect = document.getElementById("transportMode");
let currentSidebarMission = null;

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

const sidebar = document.getElementById("missionSidebar");
const overlay = document.getElementById("sidebarOverlay");
const closeBtn = document.getElementById("closeSidebar");

const sideTitle = document.getElementById("sideTitle");
const sideDescription = document.getElementById("sideDescription");
const sideStatus = document.getElementById("sideStatus");
const sidePoints = document.getElementById("sidePoints");
const sideCO2 = document.getElementById("sideCO2");
const sideActions = document.getElementById("sideActions");
const sideType = document.getElementById("sideType");

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
    card.style.cursor = "pointer";

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

    card.addEventListener("click", (e) => {
        // Don't open sidebar if the user clicked the "Apri mappa" link specifically
        if (    !e.target.closest('.start-mission-btn')) {
            openSidebar(mission);
        }
    });

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


function openSidebar(mission, transportModeSelect = "foot", factor = 1) {
    currentSidebarMission = mission; // per i cambi di mezzi di trasporto
    transportModeSelect.value = transportModeSelect;

    sideTitle.textContent = formatTitle(mission.titolo);
    sideDescription.textContent = mission.descrizione || "Nessuna descrizione fornita.";
    sideStatus.textContent = mission.stato || "Da Iniziare";
    sidePoints.textContent = `${Math.round(mission.punti*factor) || 0} pt`;
    sideCO2.textContent = formatCO2(mission.risparmioCO2) || "N/A";
    
    sideType.textContent = mission.predefinita ? "Predefinita" : "Dinamica";
    sideType.className = `mission-type ${mission.predefinita ? "" : "dynamic"}`;

    const point = getFirstPoint(mission);
    sideActions.innerHTML = createAppMapLink(point);

    sidebar.classList.add("active");
    overlay.classList.add("active");

    showMissionMap(mission);
}

function closeSidebarFunc() {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");

    if (map) {
        map.remove();
        map = null;
    }
}

// Event listeners for closing
closeBtn.addEventListener("click", closeSidebarFunc);
overlay.addEventListener("click", closeSidebarFunc);

function showMissionMap(mission) {

    // reset vecchia mappa
    if (map) {
        map.remove();
        map = null;
    }

    map = L.map("missionMap");

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap"
    }).addTo(map);

    const waypoints = [];

    // posizione utente 
    if (currentPosition?.latitudine && currentPosition?.longitudine) {
        waypoints.push(
            L.latLng(
                currentPosition.latitudine,
                currentPosition.longitudine
            )
        );
    }

    // missione predefinita arrayPOI
    if (mission.predefinita && Array.isArray(mission.arrayPOI)) {

        mission.arrayPOI.forEach(poi => {
            if (poi.lat && poi.lng) {
                waypoints.push(L.latLng(poi.lat, poi.lng));
            }
        });

    } 
    // missione dinamica, solo 1 POI
    else {
        const poi = getFirstPoint(mission);

        if (poi && poi.lat && poi.lng) {
            waypoints.push(L.latLng(poi.lat, poi.lng));
        }
    }

    if (waypoints.length < 2) return;

    const selectedMode = transportModeSelect.value;

    let routingUrl = 'https://routing.openstreetmap.de/routed-foot/route/v1'; 
    if (selectedMode === 'car') {
        routingUrl = 'https://routing.openstreetmap.de/routed-car/route/v1';
    } else if (selectedMode === 'bike') {
        routingUrl = 'https://routing.openstreetmap.de/routed-bike/route/v1';
    }

    routingControl = L.Routing.control({
        waypoints,
        router: L.Routing.osrmv1({
            serviceUrl: routingUrl,
            // openstreetmap.de richiede che l'url finisca con /driving/
            profile: 'driving'
        }),
        routeWhileDragging: false,
        draggableWaypoints: false,
        addWaypoints: false,
        show: false
    }).addTo(map);

    map.fitBounds(L.latLngBounds(waypoints));

    // fix sidebar resize bug
    setTimeout(() => {
        map.invalidateSize();
    }, 200);
}

transportModeSelect.addEventListener("change", () => {
    if (currentSidebarMission) {
        let factor = 1
        const mean = transportModeSelect.value
        if (mean === "car") {
            factor = car_factor
        } else if (mean === "bike") {
            factor = bike_factor
        }
        openSidebar(currentSidebarMission, mean, factor)
        showMissionMap(currentSidebarMission); // Ricarica la mappa con il nuovo mezzo
    }
});