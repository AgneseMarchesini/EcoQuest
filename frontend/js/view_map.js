const greenPin = L.icon({
    iconUrl: "../assets/green_pin.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -35] 
});

const bluePin = L.icon({
    iconUrl: "../assets/blue_pin.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -35] 
});

const redPin = L.icon({
    iconUrl: "../assets/red_pin.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -35]
});

async function creaMappaInterattiva(config) {
    const containerId = config.idContenitore || 'mappa';
    const urlParams = new URLSearchParams(window.location.search);
    const poiLatitudine = parseFloat(urlParams.get('latitudine'));
    const poiLongitudine = parseFloat(urlParams.get('longitudine'));
    const focusPoi = urlParams.get('focusPoi') === 'true' &&
        Number.isFinite(poiLatitudine) &&
        Number.isFinite(poiLongitudine);
    const usaGPS = focusPoi ? false : config.usaGPS || false;
    const raggio = config.raggio || 3000;
    let latitudine = focusPoi ? poiLatitudine : config.centroDefault[0];
    let longitudine = focusPoi ? poiLongitudine : config.centroDefault[1];

    let map;
    let toastTimeout;
    let userMarker;
    let selectedPoiMarker = null;

    function selezionaMarkerPoi(marker) {
        if (selectedPoiMarker && selectedPoiMarker !== marker) {
            selectedPoiMarker.setIcon(bluePin);
        }

        selectedPoiMarker = marker;
        selectedPoiMarker.setIcon(redPin);
    }

    function resetMarkerSelezionato() {
        if (selectedPoiMarker) {
            selectedPoiMarker.setIcon(bluePin);
            selectedPoiMarker = null;
        }
    }

    function getPoiCoordinates(poi) {
        const coordinates = poi.posizione?.coordinates || poi.coordinate;
        if (!Array.isArray(coordinates) || coordinates.length !== 2) {
            return null;
        }

        return {
            lat: coordinates[1],
            lng: coordinates[0]
        };
    }

    function isFocusedPoi(poi) {
        const coordinates = getPoiCoordinates(poi);
        if (!focusPoi || !coordinates) {
            return false;
        }

        return (
            Math.abs(coordinates.lat - poiLatitudine) < 0.00001 &&
            Math.abs(coordinates.lng - poiLongitudine) < 0.00001
        );
    }

    function apriSchedaPoi(poi) {
        const content = document.getElementById('sidebar-content');
        let currentImgIndex = 0;
        const immagini = poi.urlImmagini || [];

        const catHTML = (poi.categoria || []).map(c => {
            const slug = c.toLowerCase().replace(/\s+/g, '-');
            return `<span class="categoria-badge cat-${slug}">${c}</span>`;
        }).join('');

        let imgSection = '';
        if (immagini.length > 0) {
            const showButtons = immagini.length > 1 ? '' : 'hidden-btn';
            imgSection = `
                <div class="carousel-container">
                    <button class="carousel-btn prev-btn ${showButtons}" id="prevImg">❮</button>
                    <img src="${immagini[0]}" class="sidebar-img" id="mainImg">
                    <button class="carousel-btn next-btn ${showButtons}" id="nextImg">❯</button>
                </div>
            `;
        }

        content.innerHTML = `
            ${imgSection}
            <div class="sidebar-header">
                <h2>${poi.nome}</h2>
                <div class="badges-container">${catHTML}</div>
            </div>
            <div class="sidebar-body">
                <p class="description">${poi.descrizione}</p>
            </div>
        `;

        document.getElementById('sidebar').classList.remove('hidden');

        if(immagini.length > 1) {
            const imgElement = document.getElementById('mainImg');
            
            document.getElementById('nextImg').onclick = () => {
                currentImgIndex = (currentImgIndex + 1) % immagini.length;
                imgElement.src = immagini[currentImgIndex];
            };

            document.getElementById('prevImg').onclick = () => {
                currentImgIndex = (currentImgIndex - 1 + immagini.length) % immagini.length;
                imgElement.src = immagini[currentImgIndex];
            };
        }
    }

    function inizializzaMappa() {
        if (map) return;
    
        map = L.map(containerId).setView([latitudine, longitudine], 14);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);
    }

    function rimuoviOverlay() {
        const overlay = document.getElementById('gps-overlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.style.display = 'none', 500);
        }
    }

    async function scaricaPuntiDiInteresse() {
        try {
            map.eachLayer((layer) => {
                if(layer instanceof L.Marker)
                    map.removeLayer(layer);
            });
            selectedPoiMarker = null;

            if (!focusPoi) {
                const userMarker = L.marker([latitudine, longitudine], { icon: greenPin }).addTo(map);

                userMarker.on('click', () => {
                    const toast = document.getElementById('toast-messagge');
                    
                    if(toastTimeout) {
                        clearTimeout(toastTimeout);
                    }

                    toast.classList.remove('hidden-toast');
                    toast.textContent = 'Tu sei qui';

                    toastTimeout = setTimeout(() => {
                        toast.classList.add('hidden-toast');
                        toastTimeout = null;
                    }, 2000);
                });
            }

            const url = `http://localhost:3000/poi/puntiVicini?latitudine=${latitudine}&longitudine=${longitudine}&raggio=${raggio}`;
            const response = await fetch(url);
            const json = await response.json();

            if(json) {
                //L.marker([poiLatitudine, poiLongitudine]).addTo(map).bindPopup(popupContent);
                let focusedPoi = null;

                json.dati.forEach(poi => {
                    const coordinates = getPoiCoordinates(poi);
                    if (!coordinates) {
                        return;
                    }

                    if (isFocusedPoi(poi)) {
                        focusedPoi = poi;
                    }

                    const marker = L.marker(
                        [coordinates.lat, coordinates.lng], 
                        { icon: bluePin }
                    ).addTo(map);
                    
                    marker.on('click', () => {
                        selezionaMarkerPoi(marker);
                        apriSchedaPoi(poi);
                    });

                    if (isFocusedPoi(poi)) {
                        selezionaMarkerPoi(marker);
                    }
                });

                if (focusedPoi) {
                    apriSchedaPoi(focusedPoi);
                }
            }
        } catch (error) {
            console.error("Errore di rete:", error);
        }
    }

    inizializzaMappa();
    scaricaPuntiDiInteresse();

    const closeSidebarButton = document.getElementById('close-sidebar');
    if (closeSidebarButton) {
        closeSidebarButton.addEventListener('click', resetMarkerSelezionato);
    }

    if(usaGPS && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                latitudine = position.coords.latitude;
                longitudine = position.coords.longitude;

                map.flyTo([latitudine, longitudine], 15, { duration: 1.5 });
                
                rimuoviOverlay();
                scaricaPuntiDiInteresse();
            },
            () => {
                console.warn("GPS rifiutato, rimango sulla posizione di default.");
                rimuoviOverlay();
            }
        );
    } else {
        rimuoviOverlay();
    }
}
