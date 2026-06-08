/**
 * Popola la dashboard principale riservata agli account di tipo "Esercente". Al caricamento 
 * della pagina, effettua una richiesta GET (`/esercente/api/mie_attivita`) per recuperare la lista di 
 * tutte le attività commerciali registrate da quell'utente. Genera dinamicamente le schede (card) riassuntive 
 * mostrando il titolo, una breve descrizione e lo stato di moderazione (Approvata/In attesa).
 */

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkPageAuth(['Esercente'])) {
        return; 
    }

    const attivitaListContainer = document.getElementById('attivita-list');
    const errorMessageContainer = document.getElementById('errorMessage');

    try {
        const token = localStorage.getItem('token');

        const response = await fetch('/esercente/api/mie_attivita', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
            }
        });

        if (redirectToLoginIfUnauthorized(response)) {
            return; 
        }

        if (!response.ok) {
            throw new Error("Impossibile caricare le attività. Assicurati di essere loggato come esercente.");
        }

        const attivita = await response.json();

        attivitaListContainer.innerHTML = '';

        if (attivita.length === 0) {
            attivitaListContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Nessuna attività trovata</h3>
                    <p>Non hai ancora registrato nessuna attività. Clicca su "+ Aggiungi Attività" per iniziare.</p>
                </div>
            `;
            return;
        }

        attivita.forEach(item => {
            const card = document.createElement('div');
            card.className = 'attivita-card';

            const category = document.createElement('div');
            category.className = 'attivita-category';
            category.textContent = item.categoria || 'Generico'; 

            const title = document.createElement('div');
            title.className = 'attivita-title';
            title.textContent = item.nomeAttivita;

            const desc = document.createElement('div');
            desc.className = 'attivita-desc';
            const limitDesc = item.descrizione && item.descrizione.length > 80 
                ? item.descrizione.substring(0, 80) + '...' 
                : (item.descrizione || 'Nessuna descrizione fornita.');
            desc.textContent = limitDesc;

            const statusBadge = document.createElement('div');
            statusBadge.className = item.statoApprovazione ? 'badge badge-approvata' : 'badge badge-attesa';
            statusBadge.textContent = item.statoApprovazione ? '✅ Approvata' : '⏳ In attesa di approvazione';

            const link = document.createElement('a');
            link.className = 'btn-details';
            link.href = `/esercente/attivita/${item._id}`;
            link.textContent = 'Gestisci / Dettagli';

            card.appendChild(category);
            card.appendChild(title);
            card.appendChild(desc);
            card.appendChild(statusBadge);
            card.appendChild(link);

            attivitaListContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Errore Dashboard:", error);
        attivitaListContainer.innerHTML = '';
        errorMessageContainer.textContent = error.message;

    }
});
