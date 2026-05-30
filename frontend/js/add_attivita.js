const form = document.getElementById("activityForm");
const successMessage = document.getElementById("successMessage");
const errorMessage = document.getElementById("errorMessage");
const submitBtn = document.getElementById("submitBtn");
const latitudeInput = document.getElementById("latitudine");
const longitudeInput = document.getElementById("longitudine");

let selectedMarker = null;

const map = L.map("activityMap").setView([46.066423, 11.12576], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

function showMessage(element, message) {
    element.textContent = message;
    element.hidden = false;
}

function clearMessages() {
    successMessage.hidden = true;
    errorMessage.hidden = true;
    successMessage.textContent = "";
    errorMessage.textContent = "";
}

function setSelectedPosition(lat, lng) {
    latitudeInput.value = lat.toFixed(6);
    longitudeInput.value = lng.toFixed(6);

    if (selectedMarker) {
        selectedMarker.setLatLng([lat, lng]);
    } else {
        selectedMarker = L.marker([lat, lng]).addTo(map);
    }
}

function getSelectedCategories() {
    return Array.from(document.querySelectorAll('input[name="categoria"]:checked'))
        .map((checkbox) => checkbox.value);
}

function getOpeningHours() {
    const hours = {};

    document.querySelectorAll(".day-row").forEach((row) => {
        const day = row.dataset.day;
        const isOpen = row.querySelector(".day-open").checked;
        const openingTime = row.querySelector(".opening-time").value;
        const closingTime = row.querySelector(".closing-time").value;

        hours[day] = {
            aperto: isOpen,
            apertura: openingTime || "09:00",
            chiusura: closingTime || "19:00"
        };
    });

    return hours;
}

function validateOpeningHours() {
    const invalidDay = Array.from(document.querySelectorAll(".day-row")).find((row) => {
        const isOpen = row.querySelector(".day-open").checked;
        const openingTime = row.querySelector(".opening-time").value;
        const closingTime = row.querySelector(".closing-time").value;

        return isOpen && openingTime >= closingTime;
    });

    return !invalidDay;
}

function syncOpeningHourInputs() {
    document.querySelectorAll(".day-open").forEach((checkbox) => {
        const row = checkbox.closest(".day-row");
        const timeInputs = row.querySelectorAll(".opening-time, .closing-time");

        timeInputs.forEach((input) => {
            input.disabled = !checkbox.checked;
        });
    });
}

function buildPayload() {
    return {
        nomeAttivita: document.getElementById("nomeAttivita").value.trim(),
        descrizione: document.getElementById("descrizione").value.trim(),
        posizione: {
            type: "Point",
            coordinates: [
                parseFloat(longitudeInput.value),
                parseFloat(latitudeInput.value)
            ]
        },
        orari: getOpeningHours(),
        categoria: getSelectedCategories()
    };
}

document.querySelectorAll(".day-open").forEach((checkbox) => {
    checkbox.addEventListener("change", syncOpeningHourInputs);
});

map.on("click", (event) => {
    setSelectedPosition(event.latlng.lat, event.latlng.lng);
});

form.addEventListener("submit", async (event) => {
    if (!checkPageAuth(['Esercente'])) {
        return;
    }
    event.preventDefault();
    clearMessages();

    const categories = getSelectedCategories();

    if (categories.length === 0) {
        showMessage(errorMessage, "Seleziona almeno una categoria.");
        return;
    }

    if (!latitudeInput.value || !longitudeInput.value) {
        showMessage(errorMessage, "Seleziona la posizione dell'attivita sulla mappa.");
        return;
    }

    if (!validateOpeningHours()) {
        showMessage(errorMessage, "L'orario di apertura deve essere precedente alla chiusura.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Salvataggio...";

    const currentPath = window.location.pathname;

    try {
        const response = await fetch(currentPath, {
            method: "POST",
            headers: {
                'Content-Type': "application/json",
                'Authorization': `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(buildPayload())
        });

        if (redirectToLoginIfUnauthorized(response)) {
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            const message = Array.isArray(data.message)
                ? data.message.join(" ")
                : data.message || "Errore durante la creazione dell'attivita.";
            throw new Error(message);
        }

        showMessage(successMessage, "Attivita creata con successo. In attesa di approvazione.");
        form.reset();
        syncOpeningHourInputs();
        latitudeInput.value = "";
        longitudeInput.value = "";

        if (selectedMarker) {
            selectedMarker.remove();
            selectedMarker = null;
        }
    } catch (error) {
        showMessage(errorMessage, error.message || "Errore di connessione.");
        console.error("Errore creazione attivita:", error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Crea attivita";
    }
});
