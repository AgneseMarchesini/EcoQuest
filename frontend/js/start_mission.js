let activeMission = JSON.parse(sessionStorage.getItem("activeMission") || "null");

const ROUTE_TOLERANCE_METERS = 90;
const POI_REACHED_METERS = 45;

const missionTitle = document.getElementById("missionTitle");
const missionDescription = document.getElementById("missionDescription");
const missionPoints = document.getElementById("missionPoints");
const missionStatus = document.getElementById("missionStatus");
const missionStep = document.getElementById("missionStep");
const poiList = document.getElementById("poiList");
const openMapLink = document.getElementById("openMapLink");
const statusMessage = document.getElementById("statusMessage");
const trackingText = document.getElementById("trackingText");
const toggleTrackingBtn = document.getElementById("toggleTrackingBtn");

let map = null;
let routingControl = null;
let fallbackRouteLine = null;
let userMarker = null;
let accuracyCircle = null;
let routeCoordinates = [];
let watchId = null;
let trackingEnabled = false;
let routeInitializedFromUser = false;
let completionSubmitted = false;
let missionPointsArray = [];
const visitedPoiIndexes = new Set();
const poiMarkers = [];

const userIcon = L.icon({
    iconUrl: "/assets/green_pin.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -35]
});

const poiIcon = L.icon({
    iconUrl: "/assets/blue_pin.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -35]
});

const reachedPoiIcon = L.icon({
    iconUrl: "/assets/red_pin.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -35]
});

function setError(message) {
    statusMessage.textContent = message;
    statusMessage.classList.remove("hidden");
}

function setTrackingMessage(message, className = "") {
    trackingText.textContent = message;
    trackingText.className = className;
}

function formatTitle(title) {
    if (!title) {
        return "Missione";
    }

    return title
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getFirstPoint(mission) {
    return Array.isArray(mission.arrayPOI) && mission.arrayPOI.length > 0
        ? mission.arrayPOI[0]
        : null
}

function getMissionPoints(mission) {
    if (!Array.isArray(mission.arrayPOI)) {
        return [];
    }

    return mission.arrayPOI
        .map((point, index) => ({
            ...point,
            index,
            lat: Number(point.lat),
            lng: Number(point.lng)
        }))
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
}

function buildMapUrl(point) {
    if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
        return "/homepage";
    }

    const params = new URLSearchParams({
        latitudine: point.lat,
        longitudine: point.lng,
        focusPoi: "true"
    });

    return `/homepage?${params.toString()}`
}

function distanceMeters(a, b) {
    return map.distance(L.latLng(a.lat, a.lng), L.latLng(b.lat, b.lng))
}

function projectPoint(point, originLat) {
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = Math.cos(originLat * Math.PI / 180) * 111320

    return {
        x: point.lng * metersPerDegreeLng,
        y: point.lat * metersPerDegreeLat
    };
}

function distancePointToSegmentMeters(point, start, end) {
    const originLat = point.lat;
    const p = projectPoint(point, originLat);
    const a = projectPoint(start, originLat);
    const b = projectPoint(end, originLat);
    const dx = b.x - a.x;
    const dy = b.y - a.y;

    if (dx === 0 && dy === 0) {
        return distanceMeters(point, start)
    }

    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)))
    const closest = {
        x: a.x + t * dx,
        y: a.y + t * dy
    };

    return Math.hypot(p.x - closest.x, p.y - closest.y);
}

function distanceToRouteMeters(position) {
    if (routeCoordinates.length < 2) {
        return null;
    }

    let minDistance = Infinity;
    for (let i = 1; i < routeCoordinates.length; i += 1) {
        const distance = distancePointToSegmentMeters(
            position,
            routeCoordinates[i - 1],
            routeCoordinates[i]
        );
        minDistance = Math.min(minDistance, distance)
    }

    return minDistance;
}

function renderPoiList() {
    poiList.innerHTML = "";

    if (missionPointsArray.length === 0) {
        poiList.innerHTML = `<div class="poi-item">Nessun POI associato alla missione.</div>`;
        return;
    }

    missionPointsArray.forEach((point, index) => {
        const item = document.createElement("div");
        item.className = `poi-item ${visitedPoiIndexes.has(index) ? "visited" : ""}`;
        item.dataset.poiIndex = String(index)
        item.innerHTML = `
            <strong>${visitedPoiIndexes.has(index) ? "Raggiunto" : "Da raggiungere"} - POI ${index + 1}</strong>
            <span>Latitudine ${point.lat}, longitudine ${point.lng}</span>
        `;
        poiList.appendChild(item);
    })
}

function updateProgressUi() {
    missionStep.textContent = visitedPoiIndexes.size;
    renderPoiList()

    poiMarkers.forEach((marker, index) => {
        marker.setIcon(visitedPoiIndexes.has(index) ? reachedPoiIcon : poiIcon);
    })
}

function getActiveMissionId() {
    const missionId = activeMission?.userMission?.missionId || activeMission?.mission?._id
    return typeof missionId === "object" ? missionId._id : missionId
}

async function completeMissionOnServer() {
    if (completionSubmitted) {
        return;
    }

    const token = localStorage.getItem("token");
    const missionId = getActiveMissionId();

    if (!token || !missionId) {
        return
    }

    completionSubmitted = true;

    try {
        const response = await fetch("/mission/complete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ missionId })
        });

        if (redirectToLoginIfUnauthorized(response)) {
            return;
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `Errore HTTP ${response.status}`)
        }

        missionStatus.textContent = "Completata";
        sessionStorage.removeItem("activeMission")
        stopTracking();

        sessionStorage.setItem('completedMission', JSON.stringify(data));

        window.location.href = "/mission/complete_mission";
    } catch (error) {
        completionSubmitted = false;
        setError("Missione raggiunta, ma non riesco a salvarla come completata. Riprova tra poco.");
        console.error("Errore completamento missione:", error);
    }
}

function markReachedPois(position) {
    let changed = false;

    missionPointsArray.forEach((point, index) => {
        if (visitedPoiIndexes.has(index)) {
            return;
        }

        if (distanceMeters(position, point) <= POI_REACHED_METERS) {
            visitedPoiIndexes.add(index);
            changed = true;
        }
    });

    if (changed) {
        updateProgressUi();

        if (visitedPoiIndexes.size === missionPointsArray.length && missionPointsArray.length > 0) {
            completeMissionOnServer();
        }
    }

    return changed;
}

function updateTrackingState(position, accuracy) {
    if (!map) {
        return;
    }

    const latLng = L.latLng(position.lat, position.lng);
    map.setView(latLng, 16);
    if (!userMarker) {
        userMarker = L.marker(latLng, { icon: userIcon }).addTo(map).bindPopup("La tua posizione");
    } else {
        userMarker.setLatLng(latLng);
    }

    if (!accuracyCircle) {
        accuracyCircle = L.circle(latLng, {
            radius: accuracy || 0,
            color: "#1f7a55",
            fillColor: "#37ff8b",
            fillOpacity: 0.12,
            weight: 1
        }).addTo(map);
    } else {
        accuracyCircle.setLatLng(latLng);
        accuracyCircle.setRadius(accuracy || 0);
    }

    const progressChanged = markReachedPois(position);

    if (!routeInitializedFromUser || progressChanged) {
        drawRouteFromPosition(position);
        routeInitializedFromUser = true;
    }

    const distanceFromRoute = distanceToRouteMeters(position);
    if (visitedPoiIndexes.size === missionPointsArray.length && missionPointsArray.length > 0) {
        setTrackingMessage("Missione completata: hai raggiunto tutti i POI.", "on-route");
    } else if (distanceFromRoute === null) {
        setTrackingMessage("Tracking attivo. Avvicinati al prossimo POI.", "on-route");
    } else if (distanceFromRoute <= ROUTE_TOLERANCE_METERS) {
        setTrackingMessage(`Sei sul percorso. Distanza stimata dal tracciato: ${Math.round(distanceFromRoute)} m.`, "on-route");
    } else {
        setTrackingMessage(`Sei fuori percorso di circa ${Math.round(distanceFromRoute)} m. Rientra sul tracciato.`, "off-route");
    }
}

function startTracking() {
    if (!navigator.geolocation) {
        setTrackingMessage("Geolocalizzazione non disponibile nel browser.", "off-route");
        return;
    }

    if (trackingEnabled) {
        return;
    }

    trackingEnabled = true;
    toggleTrackingBtn.textContent = "Ferma tracking";
    setTrackingMessage("Recupero posizione GPS...");

    watchId = navigator.geolocation.watchPosition(
        (event) => {
            const position = {
                lat: event.coords.latitude,
                lng: event.coords.longitude
            };
            updateTrackingState(position, event.coords.accuracy);
        },
        () => {
            setTrackingMessage("Non riesco ad accedere alla posizione. Controlla i permessi GPS.", "off-route");
        },
        {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        }
    );
}

function stopTracking(keepMessage = false) {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    trackingEnabled = false;
    toggleTrackingBtn.textContent = "Attiva tracking";
    if (!keepMessage) {
        setTrackingMessage("Tracking fermo.");
    }
}

function toggleTracking() {
    if (trackingEnabled) {
        stopTracking(true);
    } else {
        startTracking();
    }
}

function initMap() {
    if (missionPointsArray.length === 0) {
        setTrackingMessage("Nessun percorso disponibile per questa missione.", "off-route");
        return;
    }

    map = L.map("missionMap");

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap"
    }).addTo(map);

    poiMarkers.length = 0;
    missionPointsArray.forEach((point, index) => {
        const marker = L.marker([point.lat, point.lng], { icon: poiIcon })
            .addTo(map)
            .bindPopup(`POI ${index + 1}`);
        poiMarkers.push(marker);
    });

    const waypointLatLngs = missionPointsArray.map((point) => L.latLng(point.lat, point.lng));
    map.fitBounds(L.latLngBounds(waypointLatLngs), { padding: [32, 32] });
    routeCoordinates = missionPointsArray.map((point) => ({ lat: point.lat, lng: point.lng }));

    drawRoute(waypointLatLngs);

    setTimeout(() => map.invalidateSize(), 150);
}

function clearRoute() {
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }

    if (fallbackRouteLine) {
        map.removeLayer(fallbackRouteLine);
        fallbackRouteLine = null;
    }
}

function drawFallbackRoute(waypoints) {
    if (waypoints.length < 2) {
        routeCoordinates = waypoints.map((point) => ({ lat: point.lat, lng: point.lng }));
        return;
    }

    fallbackRouteLine = L.polyline(waypoints, {
        color: "#1f7a55",
        weight: 5,
        opacity: 0.75
    }).addTo(map);

    routeCoordinates = waypoints.map((point) => ({ lat: point.lat, lng: point.lng }));
}

function drawRoute(waypoints) {
    clearRoute();

    if (waypoints.length < 2 || !L.Routing) {
        drawFallbackRoute(waypoints);
        return;
    }

    routingControl = L.Routing.control({
        waypoints,
        routeWhileDragging: false,
        draggableWaypoints: false,
        addWaypoints: false,
        show: false,
        createMarker: () => null
    }).addTo(map);

    routingControl.on("routesfound", (event) => {
        routeCoordinates = event.routes[0].coordinates.map((point) => ({
            lat: point.lat,
            lng: point.lng
        }));
    });

    routingControl.on("routingerror", () => {
        drawFallbackRoute(waypoints);
    });
}

function drawRouteFromPosition(position) {
    const remainingPoiPoints = missionPointsArray
        .filter((_, index) => !visitedPoiIndexes.has(index))
        .map((point) => L.latLng(point.lat, point.lng));

    const waypoints = [
        L.latLng(position.lat, position.lng),
        ...remainingPoiPoints
    ];

    drawRoute(waypoints);
}

function render() {
    if (!activeMission || !activeMission.mission || !activeMission.userMission) {
        setError("Nessuna missione attiva trovata. Torna alla lista e avviane una.");
        toggleTrackingBtn.disabled = true;
        return;
    }

    const { mission, userMission } = activeMission;
    const firstPoint = getFirstPoint(mission);

    missionPointsArray = getMissionPoints(mission);

    missionTitle.textContent = formatTitle(mission.titolo);
    missionDescription.textContent = mission.descrizione || "Missione avviata correttamente.";
    missionPoints.textContent = mission.punti || 0;
    missionStatus.textContent = userMission.stato || "InCorso";
    missionStep.textContent = userMission.currentStep || 0;
    openMapLink.href = buildMapUrl(firstPoint);

    renderPoiList();
    initMap();
    startTracking();
}

async function loadActiveMissionFromServer() {
    const token = localStorage.getItem("token");
    if (!token) {
        return null;
    }

    const response = await fetch("/mission/active", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (redirectToLoginIfUnauthorized(response)) {
        return null;
    }

    if (!response.ok) {
        return null;
    }

    const json = await response.json();
    return json.active ? json.data : null;
}

async function init() {
    if (!activeMission) {
        activeMission = await loadActiveMissionFromServer();
        if (activeMission) {
            sessionStorage.setItem("activeMission", JSON.stringify(activeMission));
        }
    }

    render();
}

toggleTrackingBtn.addEventListener("click", toggleTracking);

init();
