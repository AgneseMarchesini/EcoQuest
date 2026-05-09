// this file can be used in any page that shows the map
async function creaMappaInterattiva(config) {
    const containerId = config.idContenitore || 'mappa';
    const usaGPS = config.usaGPS || false; // false before authorization
    const raggio = config.raggio || 3000;
    let latitudine = config.centroDefault[0];
    let longitudine = config.centroDefault[1];

    let map;

    function avvia() {
        map = L.map(containerId).setView([latitudine, longitudine], 14);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        if (usaGPS) {
            L.marker([latitudine, longitudine]).addTo(map).bindPopup("<b>Tu sei qui</b>").openPopup();
        }

        scaricaPuntiDiInteresse();
    }

    async function scaricaPuntiDiInteresse() {
        try {
            const url = `http://localhost:3000/poi/puntiVicini?latitudine=${latitudine}&longitudine=${longitudine}&raggio=${raggio}`;
            const response = await fetch(url);
            const json = await response.json();

            if (json.success) {
                json.dati.forEach(poi => {
                    const categorieHTML = poi.categoria
                        .map(cat => `<span class="categoria-badge">${cat}</span>`)
                        .join('');

                    const popupContent = `
                        <div style="max-width: 250px;">
                            <h3 style="margin: 0 0 5px 0; font-size: 16px;">${poi.nome}</h3>
                            <p style="margin: 0 0 10px 0; font-size: 13px; color: #555;">${poi.descrizione}</p>
                            <div>${categorieHTML}</div>
                        </div>
                    `;

                    const poiLongitudine = poi.posizione.coordinate[0];
                    const poiLatitudine = poi.posizione.coordinate[1];

                    L.marker([poiLatitudine, poiLongitudine]).addTo(map).bindPopup(popupContent);
                });
            }
        } catch (error) {
            console.error("Errore di rete:", error);
        }
    }

    if (usaGPS && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                latitudine = position.coords.latitude;
                longitudine = position.coords.longitude;
                avvia();
            },
            () => {
                console.warn("GPS rifiutato, uso coordinate default.");
                avvia(); 
            }
        );
    } else {
        avvia();
    }
}