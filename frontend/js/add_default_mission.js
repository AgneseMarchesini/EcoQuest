const poiIcon = L.icon({
    iconUrl: "/assets/blue_pin.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -35]
});

document.addEventListener("DOMContentLoaded", async () => {
    // coordinate di trento
    const map = L.map('map').setView([46.066423, 11.12576], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let selectedPOIs = [];
    let selectedMarkers = [];

    const arrayPOIInput = document.getElementById('arrayPOI');

    const createNumberedIcon = (number) => {
        return L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="number-marker">${number}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
        });
    };

    // evento: click sulla mappa per aggiungere un punto
    try {
        const response = await fetch('/poi/pois');
        const pois = await response.json();

        pois.forEach(poi => {
            const [lng, lat] = poi.posizione.coordinates;
            const marker = L.marker([lat, lng], { icon: poiIcon }).addTo(map);

            marker.bindTooltip(poi.nome, {
                permanent: false,
                direction: "top",
                offset: [0, -38]
            });

            marker.on('click', () => {
                // evita doppia selezione
                if (selectedPOIs.includes(poi._id.toString())) {
                    return;
                }
                selectedPOIs.push(poi._id.toString());
                const order = selectedPOIs.length;
                marker.setIcon(createNumberedIcon(order));
                marker.bindTooltip(poi.nome, {
                    permanent: false,
                    direction: "top",
                    offset: [2, -24]
                });
                selectedMarkers.push(marker);
            });
        });

    } catch (error) {
        console.error(error);
    }

    // evento: cancella percorso
    document.getElementById('clearMapBtn').addEventListener('click', () => {
        selectedPOIs = [];
        selectedMarkers.forEach(marker => {
            marker.setIcon(new L.Icon.Default());
        });
        selectedMarkers = [];
        arrayPOIInput.value = "";
    });

    const form = document.getElementById('missionForm');
    const errorMessageDiv = document.getElementById('errorMessage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // reset messaggi di errore
        errorMessageDiv.innerText = "";
        errorMessageDiv.style.color = "red";

        // validazione mappa
        if (selectedPOIs.length === 0) {
            errorMessageDiv.innerText = "Devi selezionare almeno un punto sulla mappa per creare il percorso.";
            return;
        }

        const payload = {
            titolo: document.getElementById('titolo').value,
            descrizione: document.getElementById('descrizione').value,
            arrayPOI: selectedPOIs, 
            punti: Number(document.getElementById('punti').value),
            stato: document.getElementById('stato').value,
            predefinita: true
        };

        const bonusInput = document.getElementById('bonusGamification').value;
        if (bonusInput) payload.bonusGamification = Number(bonusInput);

        const co2Input = document.getElementById('risparmioCO2').value;
        if (co2Input) payload.risparmioCO2 = Number(co2Input);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/admin/add_mission", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": "Bearer " + token
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                errorMessageDiv.style.color = "#1ea85a"; 
                errorMessageDiv.innerText = "Missione creata con successo!";
                
                form.reset();
                document.getElementById('clearMapBtn').click();
                
                setTimeout(() => { errorMessageDiv.innerText = ""; }, 3000);
            } else {
                if (Array.isArray(data.message)) {
                    errorMessageDiv.innerText = data.message.join(", ");
                } else {
                    errorMessageDiv.innerText = data.message || "Errore sconosciuto.";
                }
            }
        } catch (error) {
            console.error("Errore di rete:", error);
            errorMessageDiv.innerText = "Impossibile connettersi al server.";
        }
    });
});