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

async function creaMappaInterattiva(config) {
    const containerId = config.idContenitore || 'mappa';
    const usaGPS = config.usaGPS || false;
    const raggio = config.raggio || 3000;
    let latitudine = config.centroDefault[0];
    let longitudine = config.centroDefault[1];

    let map;
    let toastTimeout;
    let userMarker;

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

            const userMarker = L.marker([latitudine, longitudine], { icon: greenPin }).addTo(map);

            userMarker.on('click', () => {
                const toast = document.getElementById('toast-messagge');
                
                if(toastTimeout) {
                    clearTimeout(toastTimeout);
                }

                toast.classList.remove('hidden-toast');

                toastTimeout = setTimeout(() => {
                    toast.classList.add('hidden-toast');
                    toastTimeout = null;
                }, 2000);
            });

            const url = `http://localhost:3000/poi/puntiVicini?latitudine=${latitudine}&longitudine=${longitudine}&raggio=${raggio}`;
            const response = await fetch(url);
            const json = await response.json();

            if(json) {
                //L.marker([poiLatitudine, poiLongitudine]).addTo(map).bindPopup(popupContent);

                json.dati.forEach(poi => {
                    const marker = L.marker(
                        [poi.posizione.coordinates[1], poi.posizione.coordinates[0]], 
                        { icon: bluePin }
                    ).addTo(map);
                    
                    marker.on('click', () => {
                        const content = document.getElementById('sidebar-content');
                        let currentImgIndex = 0;
                        const immagini = poi.urlImmagini || [];

                        const catHTML = poi.categoria.map(c => {
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
                    });
                });
            }
        } catch (error) {
            console.error("Errore di rete:", error);
        }
    }

    inizializzaMappa();
    scaricaPuntiDiInteresse();

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