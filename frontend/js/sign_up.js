/**
 * Controlla l'interfaccia e la logica di registrazione dei nuovi account. Implementa un meccanismo 
 * di form dinamico che mostra o nasconde i campi richiesti in base alla tipologia di profilo selezionata 
 * (Utente normale vs. Esercente). Per gli Esercenti, esige dati fiscali aggiuntivi (Nome, Cognome, CF, Partita IVA). 
 * Esegue controlli di validazione (es. corrispondenza delle password) e invia il payload strutturato a `/auth/sign_up`.
 */

const radioUtente = document.getElementById("userUtente");
const radioEsercente = document.getElementById("userEsercente");
const labelUtente = document.getElementById("labelUtente");
const labelEsercente = document.getElementById("labelEsercente");
const esercenteFieldsDiv = document.getElementById("esercenteFields");

function switchUserType(selectedType) {
    if (selectedType === "Utente") {
        labelUtente.classList.add("active");
        labelEsercente.classList.remove("active");
        
        esercenteFieldsDiv.style.display = "none";
    } else if (selectedType === "Esercente") {
        labelEsercente.classList.add("active");
        labelUtente.classList.remove("active");
        
        esercenteFieldsDiv.style.display = "block";
    }
}

radioUtente.addEventListener("change", () => switchUserType("Utente"));
radioEsercente.addEventListener("change", () => switchUserType("Esercente"));

function showError(msg) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.innerText = msg;
}

document.getElementById("signupForm").addEventListener("submit", async(e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("submitBtn");

    const selectedRadio = document.querySelector("input[name=\"accountType\"]:checked");
    const selectedType = selectedRadio ? selectedRadio.value : "";

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const repeatedPassword = document.getElementById("repeated-password").value;

    if(!username || !email || !password || !repeatedPassword)
        return showError("Alcuni campi non sono stati compilati");

    if(password != repeatedPassword)
        return showError("Le password non corrispondono");

    const formData = {
        type: selectedType,
        username: username,
        email: email,
        password: password
    };

    if(selectedType === "Esercente") {
        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const fiscalCode = document.getElementById("fiscalCode").value;
        const pIva = document.getElementById("pIva").value;

        if(!firstName || !lastName || !fiscalCode || !pIva)
            return showError("Alcuni campi non sono stati compilati")
        
        formData.nome = firstName;
        formData.cognome = lastName;
        formData.codiceFiscale = fiscalCode;
        formData.partitaIVA = pIva; 
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "..."

    try {
        const response = await fetch("/auth/sign_up", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if(response.ok) {
            document.getElementById("signupForm").reset();
            showError("");

            window.location.href = "/auth/login"
        } else {
            showError(result.message || "Errore interno");
        }
    } catch (error) {
        showError("Impossibile connettersi al server");
        console.error("Fetch Error:", error);
    } finally {
        submitBtn.innerText = "Invia"
        submitBtn.disabled = false;
    }
});