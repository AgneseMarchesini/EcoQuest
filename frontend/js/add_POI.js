function showError(message) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.innerText = message;
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
    const { lat, lng } = e.latlng;
    position.lat = lat
    position.lng = lng
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;

    if (marker) {
        marker.setLatLng([lat, lng]);
    } else {
        marker = L.marker([lat, lng]).addTo(map);
    }

    console.log("Latitudine:", lat);
    console.log("Longitudine:", lng);

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

    const nome = document.getElementById("nome").value;
    const descrizione = document.getElementById("descrizione").value;
    const imageUrls = Array.from(document.querySelectorAll(".image-input"))
        .map(input => input.value.trim())
        .filter(value => value !== "");
    const checkedValues = Array.from(document.querySelectorAll('input[id="categoria"]:checked'))
        .map(cb => cb.value);

    const formData = {
        nome: nome,
        descrizione: descrizione,
        coordinate: [position.lng, position.lat],
        urlImmagini: imageUrls,
        categoria: checkedValues
    }

    try {
        const token = localStorage.getItem("token")
        const response = await fetch("/admin/add_POI", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(formData)
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
    } catch (err) {
        console.log("CATCH:", err.message);
        showError("Errore di connessione");
    }
});