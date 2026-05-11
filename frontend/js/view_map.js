async function creaMappaInterattiva(config) {
    const containerId = config.idContenitore || 'mappa';
    const usaGPS = config.usaGPS || false;
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

            if(json) {
                //L.marker([poiLatitudine, poiLongitudine]).addTo(map).bindPopup(popupContent);

                json.dati.forEach(poi => {
                    const marker = L.marker([poi.posizione.coordinates[1], poi.posizione.coordinates[0]]).addTo(map);
                    
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

    if(usaGPS && "geolocation" in navigator) {
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