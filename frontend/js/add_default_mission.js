document.addEventListener("DOMContentLoaded", () => {
    // coordinate di trento
    const map = L.map('map').setView([46.066423, 11.12576], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let waypoints = []; 
    let markers = [];

    const arrayPOIInput = document.getElementById('arrayPOI');

    const createNumberedIcon = (number) => {
        return L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="number-marker">${number}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12] 
        });
    };

    // evento: click sulla mappa per aggiungere un punto
    map.on('click', function(e) {
        const currentOrder = waypoints.length + 1;
        const newMarker = L.marker(e.latlng, { icon: createNumberedIcon(currentOrder) }).addTo(map);
        markers.push(newMarker);

        waypoints.push({ lat: e.latlng.lat, lng: e.latlng.lng });

        arrayPOIInput.value = JSON.stringify(waypoints);
    });

    // evento: cancella percorso
    document.getElementById('clearMapBtn').addEventListener('click', () => {
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        waypoints = [];
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
        if (!arrayPOIInput.value || waypoints.length === 0) {
            errorMessageDiv.innerText = "Devi selezionare almeno un punto sulla mappa per creare il percorso.";
            return;
        }

        const payload = {
            titolo: document.getElementById('titolo').value,
            descrizione: document.getElementById('descrizione').value,
            arrayPOI: waypoints, 
            punti: Number(document.getElementById('punti').value),
            stato: document.getElementById('stato').value,
            predefinita: true
        };

        const bonusInput = document.getElementById('bonusGamification').value;
        if (bonusInput) payload.bonusGamification = Number(bonusInput);

        const co2Input = document.getElementById('risparmioCO2').value;
        if (co2Input) payload.risparmioCO2 = Number(co2Input);

        try {
            const response = await fetch('/admin/add_mission', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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