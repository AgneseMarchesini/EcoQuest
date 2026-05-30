document.getElementById('couponForm').addEventListener('submit', async function (e) {
    if (!checkPageAuth(['Esercente'])) {
        return;
    }
    e.preventDefault(); 

    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    successMsg.textContent = '';
    errorMsg.textContent = '';

    const titolo = document.getElementById('titolo').value.trim();
    const descrizione = document.getElementById('descrizione').value.trim();
    const costoInPunti = document.getElementById('costoInPunti').value;
    const scadenza = document.getElementById('scadenza').value;

    const categoriaSelezionata = document.querySelector('input[name="categoria"]:checked');

    if (!categoriaSelezionata) {
        errorMsg.textContent = "Devi selezionare una categoria.";
        errorMsg.style.display = 'block';
        return;
    }

    const payload = {
        titolo: titolo,
        descrizione: descrizione,
        costoInPunti: parseInt(costoInPunti, 10),
        scadenza: scadenza,
        categoria: categoriaSelezionata.value
    };

    const currentPath = window.location.pathname;

    try {
        const response = await fetch(currentPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        });

        if (redirectToLoginIfUnauthorized(response)) {
            return;
        }


        const data = await response.json();

        if (response.status === 201) {
            successMsg.innerHTML = `Coupon creato con successo!<br>Codice: <strong>${data.codice}</strong>`;
            successMsg.style.display = 'block';
            
            document.getElementById('couponForm').reset();
        } else if (response.status === 400 || response.status === 409 || response.status === 500) {
            let errorText = "";
            if (Array.isArray(data.message)) {
                errorText = data.message.join("<br>");
            } else {
                errorText = data.message || "Si è verificato un errore.";
            }
            errorMsg.innerHTML = errorText;
            errorMsg.style.display = 'block';
        }
    } catch (err) {
        errorMsg.textContent = "Errore di connessione. Impossibile contattare il server.";
        errorMsg.style.display = 'block';
        console.error("Fetch error:", err);
    }
    });