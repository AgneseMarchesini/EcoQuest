let messageTimeout;

function showError(message) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.innerText = message;
}

function showSuccess(message) {
    const successMessage = document.getElementById("successMessage");
    successMessage.innerText = message;

    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }
    if (message !== "") {
        messageTimeout = setTimeout(() => {
            successMessage.innerText = "";
        }, 5000); 
    }
}

const map = L.map('map').setView([46.067, 11.121], 13);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);

let marker;
const position = {
    lat: null,
    lng: null
}

map.on('click', function (e) {
    const { lat: latitudine, lng: longitudine } = e.latlng;
    position.lat = latitudine
    position.lng = longitudine
    document.getElementById('latitudine').value = latitudine;
    document.getElementById('longitudine').value = longitudine;

    if (marker) {
        marker.setLatLng([latitudine, longitudine]);
    } else {
        marker = L.marker([latitudine, longitudine]).addTo(map);
    }

    console.log("Latitudine:", latitudine);
    console.log("Longitudine:", longitudine);

});

const imagesContainer = document.getElementById("images-container");

imagesContainer.addEventListener("input", function (e) {

    const inputs = document.querySelectorAll(".image-input");

    const lastInput = inputs[inputs.length - 1];


    if (e.target === lastInput && lastInput.value.trim() !== "") {

        const newInput = document.createElement("input");

        newInput.type = "url";
        newInput.name = "images";
        newInput.className = "image-input";
        newInput.placeholder = "https://...";

        imagesContainer.appendChild(newInput);
    }

});

document.getElementById("aggiungiPoi").addEventListener("submit", async (e) => {
    e.preventDefault();

    if(!position.lat || !position.lng)
        return showError("Coordinate non valide");

    const latitudine = position.lat;
    const longitudine = position.lng

    const nome = document.getElementById("nome").value;
    const descrizione = document.getElementById("descrizione").value;
    const urlImmagini = Array.from(document.querySelectorAll(".image-input"))
        .map(input => input.value.trim())
        .filter(value => value !== "");
    const categoria = Array.from(document.querySelectorAll('.categoria:checked'))
        .map(cb => cb.value);

    const meteoCondition = Array.from(document.querySelectorAll('.meteo:checked'))
        .map(cb => cb.value);

    const poi = {
        nome,
        descrizione,
        urlImmagini,
        posizione: {
            type: "Point",
            coordinates: [longitudine, latitudine]
        },
        categoria,
        meteoCondition
    };

    try {
        const token = localStorage.getItem("token")
        const response = await fetch("/admin/add_POI", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(poi)
        });

        console.log("STATUS:", response.status);
        console.log("OK:", response.ok);
        console.log("RAW TEXT:", await response.clone().text());

        const data = await response.json();

        console.log("response.ok:", response.ok);
        console.log("data:", data);

        if (!response.ok) {
            showError(data.message || "Errore di add_POI");
            return;
        }

        showError("");
        showSuccess("POI aggiunto con successo!");

        // pulizia dei campi
        document.getElementById("aggiungiPoi").reset();

        if (marker) {
            map.removeLayer(marker);
            marker = null;
        }
        position.lat = null;
        position.lng = null;
        document.getElementById('latitudine').value = "";
        document.getElementById('longitudine').value = "";

        const imagesContainer = document.getElementById("images-container");
        imagesContainer.innerHTML = '<input type="url" name="images" class="image-input" placeholder="https://...">';

    } catch (err) {
        console.log("CATCH:", err.message);
        showError("Errore di connessione");
    }
});