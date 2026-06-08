/**
 * Controlla la logica della schermata di riepilogo visualizzata al termine di una missione. 
 * Estrae i dati della sessione locale per calcolare e mostrare il tempo effettivo impiegato e i punti 
 * ricompensa ottenuti. Inoltre, utilizza Leaflet e il servizio di routing OSRM per tracciare e disegnare 
 * graficamente sulla mappa il percorso compiuto, adattando la rotta in base al mezzo di trasporto usato 
 * (a piedi, in bici, in auto).
 */

const storedData = sessionStorage.getItem('completedMission');

if(storedData) {
    const parsedData = JSON.parse(storedData);

    const points = parsedData.reward || 0;

    let timeFormatted = "00:00";
    if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        const diffMs = end - start; 

        if(diffMs > 0) {
            const totalSeconds = Math.floor(diffMs / 1000);
            
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            if (hours > 0) {
                timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            } else {
                timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }
    }

    document.getElementById("pointsEarned").innerText = points;
    document.getElementById("timeUsed").innerText = timeFormatted;
}

function mostraMappaRiassuntiva(data) {
    let map = L.map("summaryMap");

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap"
    }).addTo(map);

    const percorso = data.percorso || [];
    const waypoints = [];

    if (Array.isArray(percorso) && percorso.length > 0) {
        percorso.forEach(poi => {
            const lat = poi.lat || poi.latitudine;
            const lng = poi.lng || poi.longitudine;
            
            if (lat && lng) {
                waypoints.push(L.latLng(lat, lng));
            }
        });
    }

    if(waypoints.length >= 2) {
        const selectedMode = sessionStorage.getItem("transportMode") || 'foot'; 

        let routingUrl = 'https://routing.openstreetmap.de/routed-foot/route/v1'; 
        if (selectedMode === 'car') {
            routingUrl = 'https://routing.openstreetmap.de/routed-car/route/v1';
        } else if (selectedMode === 'bike') {
            routingUrl = 'https://routing.openstreetmap.de/routed-bike/route/v1';
        }

        L.Routing.control({
            waypoints: waypoints,
            router: L.Routing.osrmv1({
                serviceUrl: routingUrl,
                profile: 'driving'
            }),
            routeWhileDragging: false,
            draggableWaypoints: false,
            addWaypoints: false,
            show: false, 
            lineOptions: {
                styles: [{ color: '#2ecc71', opacity: 0.8, weight: 6 }]
            }
        }).addTo(map);

        map.fitBounds(L.latLngBounds(waypoints));
    } else {
        return;
    }

    setTimeout(() => {
        map.invalidateSize();
    }, 300);
}