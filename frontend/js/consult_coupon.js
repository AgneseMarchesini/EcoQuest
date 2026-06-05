/**
 * Gestisce l'interfaccia per l'economia di gioco lato utente, divisa tra "Negozio" e 
 * "Portafogli". Recupera il saldo punti dell'utente e il catalogo premi, offrendo una doppia modalità di 
 * visualizzazione (a griglia o geolocalizzata su mappa interattiva). Controlla la disponibilità economica 
 * per ogni acquisto, gestisce la transazione comunicando con il backend e archivia i premi comprati 
 * nel portafogli personale pronti per il riscatto fisico.
 */

let selectedCouponId = null;
let selectedCouponCode = null;
let currentUserPoints = 0;

let allCoupons = []; 
let map = null;
let markers = [];
let isMapView = false;
let userMarker = null;
let selectedPoiMarker = null;

const shopViewRadio = document.getElementById("shopView");
const walletViewRadio = document.getElementById("walletView");
const couponGrid = document.getElementById("couponGrid");
const walletGrid = document.getElementById("walletGrid");
const pageTitle = document.getElementById("pageTitle");
const userPoints = document.getElementById("userPoints");
const refreshBtn = document.getElementById("refreshBtn");
const buyBtn = document.getElementById("buyBtn");
const sideTitle = document.getElementById("sideTitle");
const sideCategory = document.getElementById("sideCategory");
const sideDescription = document.getElementById("sideDescription");
const sideCost = document.getElementById("sideCost");
const sideExpiration = document.getElementById("sideExpiration");
const sideActivity = document.getElementById("sideActivity");
const pointsWarning = document.getElementById("pointsWarning");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const couponSidebar = document.getElementById("couponSidebar");
const closeSidebar = document.getElementById("closeSidebar");
const toggleMapBtn = document.getElementById("toggleMapBtn");
const mapContainer = document.getElementById("mapContainer");
const locateUserBtn = document.getElementById("locateUserBtn");
const sideQuantity = document.getElementById("sideQuantity");
const emptyWarning = document.getElementById("emptyWarning");

const greenPin = L.icon({
    iconUrl: "/assets/green_pin.png", 
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -35] 
});

const bluePin = L.icon({
    iconUrl: "/assets/blue_pin.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -35] 
});

const redPin = L.icon({
    iconUrl: "/assets/red_pin.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -35]
});

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

shopViewRadio.addEventListener("change", () => {
    if (shopViewRadio.checked) {
        pageTitle.innerText = "Negozio Coupon";
        walletGrid.style.display = "none";
        toggleMapBtn.style.display = "inline-block"; 
        
        if (isMapView) {
            mapContainer.style.display = "block";
            couponGrid.style.display = "none";
            locateUserBtn.style.display = "inline-block";
        } else {
            mapContainer.style.display = "none";
            couponGrid.style.display = "grid";
            locateUserBtn.style.display = "none";
        }
        loadDashboardData();
    }
});

walletViewRadio.addEventListener("change", () => {
    if (walletViewRadio.checked) {
        pageTitle.innerText = "Portafogli";
        couponGrid.style.display = "none";
        mapContainer.style.display = "none";
        toggleMapBtn.style.display = "none"; 
        locateUserBtn.style.display = "none";
        walletGrid.style.display = "grid";
        loadWalletData();
    }
});

toggleMapBtn.addEventListener("click", () => {
    isMapView = !isMapView;
    if (isMapView) {
        mapContainer.style.display = "block";
        couponGrid.style.display = "none";
        locateUserBtn.style.display = "inline-block";
        toggleMapBtn.innerText = "Lista";
        toggleMapBtn.style.background = "#e67e22";
        
        if (!map) {
            initMap();
        }
        setTimeout(() => map.invalidateSize(), 50);
        updateMapMarkers();
    } else {
        mapContainer.style.display = "none";
        couponGrid.style.display = "grid";
        locateUserBtn.style.display = "none";
        toggleMapBtn.innerText = "Mappa";
        toggleMapBtn.style.background = "#e67e22";
    }
});

locateUserBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        alert("La geolocalizzazione non è supportata dal tuo browser.");
        return;
    }

    locateUserBtn.innerText = "🔍 Ricerca...";
    locateUserBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            if (map) {
                map.flyTo([lat, lng], 15, { duration: 1.5 });

                if (userMarker) {
                    userMarker.setLatLng([lat, lng]);
                } else {
                    userMarker = L.marker([lat, lng], { icon: greenPin }).addTo(map);
                    userMarker.bindPopup("<b>La tua posizione attuale</b>").openPopup();
                }
            }

            locateUserBtn.innerText = "📍 Usa Posizione";
            locateUserBtn.disabled = false;
        },
        () => {
            console.warn("GPS rifiutato, rimango sulla posizione di default.");
            alert("Impossibile accedere alla tua posizione. Verifica i permessi.");
            locateUserBtn.innerText = "📍 Usa Posizione";
            locateUserBtn.disabled = false;
        }
    );
});

refreshBtn.addEventListener("click", () => {
    if (shopViewRadio.checked) {
        loadDashboardData();
    } else {
        loadWalletData();
    }
});

closeSidebar.addEventListener("click", closeSidebarAnim);
sidebarOverlay.addEventListener("click", closeSidebarAnim);
buyBtn.addEventListener("click", handlePurchase);

function initMap() {
    map = L.map('map').setView([46.0678, 11.1211], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', resetMarkerSelezionato);
}

function updateMapMarkers() {
    if (!map) return;

    markers.forEach(m => map.removeLayer(m));
    markers = [];
    resetMarkerSelezionato();

    const attivitaGruppate = {};

    allCoupons.forEach(coupon => {
        const att = coupon.attivitaId;
        if (att && att._id) {

            if (!attivitaGruppate[att._id]) {
                const lng = (att.posizione && att.posizione.coordinates && att.posizione.coordinates.length === 2) ? att.posizione.coordinates[0] : 11.1211;
                const lat = (att.posizione && att.posizione.coordinates && att.posizione.coordinates.length === 2) ? att.posizione.coordinates[1] : 46.0678;

                attivitaGruppate[att._id] = {
                    nome: att.nomeAttivita || "Attività partner",
                    lat: lat, 
                    lng: lng,
                    coupons: []
                };
            }
            attivitaGruppate[att._id].coupons.push(coupon);
        }
    });

    Object.values(attivitaGruppate).forEach(att => {
        const marker = L.marker([att.lat, att.lng], { icon: bluePin }).addTo(map);
        
        let popupHtml = `<div class="map-popup-content">
            <h4 style="margin: 0 0 8px 0; color: #1a252f; border-bottom: 1px solid #eee; padding-bottom: 4px;">📍 ${att.nome}</h4>
            <p style="margin: 0 0 6px 0; font-size: 0.8rem; color: #7f8c8d;">Seleziona un coupon:</p>
            <ul style="padding-left: 16px; margin: 0; font-size: 0.9rem; max-height: 150px; overflow-y: auto;">`;
        
        att.coupons.forEach(c => {
            popupHtml += `
                <li style="margin-bottom: 5px;">
                    <a href="#" onclick="window.openCouponFromMap('${c._id}'); return false;" style="color: #2ecc71; text-decoration: none; font-weight: 600;">
                        ${c.titolo}
                    </a> <span style="color: #e67e22; font-size: 0.8rem;">(${c.costoInPunti} pt | Disp: ${c.quantita})</span>
                </li>`;
        });
        
        popupHtml += `</ul></div>`;
        marker.bindPopup(popupHtml);

        marker.on('click', () => {
            selezionaMarkerPoi(marker);
        });
        marker.on('popupclose', () => {
            if (selectedPoiMarker === marker) {
                resetMarkerSelezionato();
            }
        });

        markers.push(marker);
    });
}

window.openCouponFromMap = function(couponId) {
    const coupon = allCoupons.find(c => c._id === couponId);
    if (coupon) {
        openSidebar(coupon);
    }
};

async function loadDashboardData() {
    userPoints.innerText = "-";
    if (!isMapView) {
        couponGrid.innerHTML = '<div class="status-message loading-state">Caricamento in corso...</div>';
    }
    
    try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const userResponse = await fetch("/user/api/punti", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        if (redirectToLoginIfUnauthorized(userResponse)) return;

        if (userResponse.ok) {
            const userData = await userResponse.json();
            currentUserPoints = userData.currentPoints ?? 0;
            userPoints.innerText = currentUserPoints;
        } else {
            userPoints.innerText = "0";
        }

        const couponResponse = await fetch("/coupon/api/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        if (redirectToLoginIfUnauthorized(couponResponse)) return;

        if (!couponResponse.ok) {
            couponGrid.innerHTML = '<div class="status-message empty-state">Il negozio al momento è vuoto :(</div>';
            return;
        }

        const couponData = await couponResponse.json();
        
        if (!couponData.data || couponData.data.length === 0) {
            couponGrid.innerHTML = '<div class="status-message empty-state">Il negozio al momento è vuoto :(</div>';
            allCoupons = [];
        } else {
            allCoupons = couponData.data;
            couponGrid.innerHTML = "";
            renderCoupons(allCoupons);
            
            if (isMapView) {
                updateMapMarkers();
            }
        }

    } catch (error) {
        console.error(error);
        couponGrid.innerHTML = '<div class="status-message empty-state">Errore nel caricamento del negozio.</div>';
    }
}

async function loadWalletData() {
    userPoints.innerText = "-";
    walletGrid.innerHTML = '<div class="status-message loading-state">Caricamento in corso...</div>';

    try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const userResponse = await fetch("/user/api/punti", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        if (userResponse.ok) {
            const userData = await userResponse.json();
            currentUserPoints = userData.currentPoints ?? 0;
            userPoints.innerText = currentUserPoints;
        } else {
            userPoints.innerText = "0";
        }

        const walletResponse = await fetch("/coupon/api/acquistati", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        if (!walletResponse.ok) {
            walletGrid.innerHTML = '<div class="status-message empty-state">Il tuo portafogli al momento è vuoto :(</div>';
            return;
        }

        const walletData = await walletResponse.json();

        if (!walletData.data || walletData.data.length === 0) {
            walletGrid.innerHTML = '<div class="status-message empty-state">Il tuo portafogli al momento è vuoto :(</div>';
        } else {
            walletGrid.innerHTML = "";
            renderWalletCoupons(walletData.data);
        }

    } catch (error) {
        console.error(error);
        walletGrid.innerHTML = '<div class="status-message empty-state">Errore nel caricamento del portafogli.</div>';
    }
}

function renderCoupons(coupons) {
    couponGrid.innerHTML = "";
    coupons.forEach(coupon => {
        const card = document.createElement("div");
        card.className = "coupon-card";
        const nomeAttivita = coupon.attivitaId ? coupon.attivitaId.nomeAttivita : "Attività Partner";

        card.innerHTML = `
            <span class="card-category">${coupon.categoria || 'Generico'}</span>
            <h3 class="card-title">${coupon.titolo}</h3>
            <p class="card-activity">🏢 ${nomeAttivita}</p>
            <div class="card-footer">
                <span class="card-cost">${coupon.costoInPunti} Punti</span>
                <span class="card-quantity" style="font-size: 0.85rem; color: #7f8c8d;">Disponibili: ${coupon.quantita}</span>
            </div>
        `;
        card.addEventListener("click", () => openSidebar(coupon));
        couponGrid.appendChild(card);
    });
}

function renderWalletCoupons(purchasedCoupons) {
    walletGrid.innerHTML = "";
    purchasedCoupons.forEach(item => {
        const coupon = item.couponId || item; 
        const card = document.createElement("div");
        card.className = "coupon-card wallet-card";
        const nomeAttivita = coupon.attivitaId ? coupon.attivitaId.nomeAttivita : "Attività Partner";
        const dataScadenza = coupon.scadenza ? new Date(coupon.scadenza).toLocaleDateString('it-IT') : 'N/A';
        card.innerHTML = `
            <span class="card-category">${coupon.categoria || 'Acquistato'}</span>
            <h3 class="card-title">${coupon.titolo}</h3>
            <p class="card-activity">🏢 ${nomeAttivita}</p>
            <div class="card-footer">
                <span style="font-size: 0.85rem; color: #7f8c8d;">📅 Scade il: <strong>${dataScadenza}</strong></span>
                <span class="card-cost">Riscatta ora</span>
            </div>
        `;
        card.addEventListener("click", () => redirectToRedeem(item._id));
        walletGrid.appendChild(card);
    });
}

function openSidebar(coupon) {
    selectedCouponId = coupon._id;
    selectedCouponCode = coupon.codice;

    const nomeAttivita = coupon.attivitaId ? coupon.attivitaId.nomeAttivita : (coupon.attivita ? coupon.attivita.nome : "Attività Partner");

    sideTitle.innerText = coupon.titolo;
    sideCategory.innerText = coupon.categoria || 'Generico';
    sideDescription.innerText = coupon.descrizione || '';
    sideCost.innerText = coupon.costoInPunti;
    sideExpiration.innerText = coupon.scadenza ? new Date(coupon.scadenza).toLocaleDateString('it-IT') : 'N/A';
    sideActivity.innerText = nomeAttivita;
    sideQuantity.innerText = coupon.quantita;

    let canBuy = true;

    if (coupon.quantita <= 0) {
        emptyWarning.style.display = "block";
        pointsWarning.style.display = "none";
        canBuy = false;
    } else if (currentUserPoints < coupon.costoInPunti) {
        pointsWarning.style.display = "block";
        emptyWarning.style.display = "none";
        canBuy = false;
    } else {
        pointsWarning.style.display = "none";
        emptyWarning.style.display = "none";
    }

    buyBtn.disabled = !canBuy;

    sidebarOverlay.classList.add("active");
    couponSidebar.classList.add("active");
}

function closeSidebarAnim() {
    sidebarOverlay.classList.remove("active");
    couponSidebar.classList.remove("active");
    resetMarkerSelezionato();
}

async function handlePurchase() {
    if (!selectedCouponCode) return;

    try {
        buyBtn.disabled = true;
        buyBtn.innerText = "Elaborazione...";

        const token = localStorage.getItem("token");
        
        const response = await fetch(`/coupon/api/acquista/${selectedCouponCode}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Errore durante l'acquisto.");
        }

        alert("🎉 Coupon acquistato con successo!");
        closeSidebarAnim();
        loadDashboardData(); 

    } catch (error) {
        console.error("Errore durante l'acquisto:", error);
        alert("❌ " + error.message);
    } finally {
        buyBtn.innerText = "Acquista Coupon";
        buyBtn.disabled = false;
    }
}

function redirectToRedeem(couponId) {
    window.location.href = `/coupon/riscatta?id=${couponId}`;
}

document.addEventListener("DOMContentLoaded", () => {
    loadDashboardData();
});