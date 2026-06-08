/**
 * Gestisce l'interfaccia della dashboard amministrativa dedicata alla moderazione delle 
 * nuove attività commerciali. Recupera tramite API (`GET /admin/api/approvazioni`) la lista delle richieste 
 * inoltrate dagli Esercenti, generando dinamicamente delle schede riassuntive con dettagli come categorie, 
 * orari e coordinate geografiche. Infine, gestisce le azioni di approvazione o eliminazione.
 */

document.addEventListener("DOMContentLoaded", () => {
    if (typeof checkPageAuth === "function" && !checkPageAuth(['Amministratore'])) {
        return;
    }

    loadPendingRequests();
});

const requestsContainer = document.getElementById("requestsContainer");

async function loadPendingRequests() {
    requestsContainer.innerHTML = '<div class="status-message loading-state">Caricamento in corso...</div>';

    try {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/auth/login";
            return;
        }

        const response = await fetch("/admin/api/approvazioni", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            throw new Error("Errore nel recupero delle richieste.");
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            requestsContainer.innerHTML = '<div class="status-message empty-state">Nessuna attività in attesa di approvazione.</div>';
            return;
        }

        requestsContainer.innerHTML = "";
        renderRequests(data);

    } catch (error) {
        console.error(error);
        requestsContainer.innerHTML = '<div class="status-message empty-state">Errore durante il caricamento dei dati.</div>';
    }
}

function renderRequests(activities) {
    activities.forEach(activity => {
        const card = document.createElement("div");
        card.className = "activity-card";

        const categoriesHtml = activity.categoria.map(cat => `<span class="category-badge">${cat}</span>`).join("");

        let hoursHtml = "";
        if (activity.orari) {
            hoursHtml = Object.entries(activity.orari).map(([giorno, info]) => {
                const statusText = info.aperto ? `${info.apertura} - ${info.chiusura}` : "Chiuso";
                return `<div class="hours-row"><span>${giorno.charAt(0).toUpperCase() + giorno.slice(1)}:</span> <span>${statusText}</span></div>`;
            }).join("");
        }

        const lng = activity.posizione?.coordinates?.[0] ?? "N/D";
        const lat = activity.posizione?.coordinates?.[1] ?? "N/D";

        card.innerHTML = `
            <h3 class="activity-title">${activity.nomeAttivita}</h3>
            <div class="categories-container">${categoriesHtml}</div>
            <p class="activity-desc">${activity.descrizione}</p>
            
            <div class="info-group">
                <p><strong>Coordinate:</strong> Lat: ${lat}, Lng: ${lng}</p>
                <p><strong>Orari di Apertura:</strong></p>
                <div class="hours-details">${hoursHtml}</div>
            </div>

            <div class="actions-container">
                <button class="btn btn-reject" onclick="handleAction('${activity._id}', 'rifiuta')">Elimina</button>
                <button class="btn btn-approve" onclick="handleAction('${activity._id}', 'approva')">Approva</button>
            </div>
        `;

        requestsContainer.appendChild(card);
    });
}

async function handleAction(id, action) {
    const token = localStorage.getItem("token");
    const method = action === "approva" ? "PATCH" : "DELETE";
    const url = `/admin/api/approvazioni/${id}/${action}`;

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Impossibile completare l'azione.");
        }

        alert(result.message);
        loadPendingRequests();

    } catch (error) {
        console.error(error);
        alert("❌ " + error.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadPendingRequests();
});