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

    showError("loading");

    const submitBtn = document.getElementById("submitBtn");

    const selectedRadio = document.querySelector("input[name=\"accountType\"]:checked");
    const selectedType = selectedRadio ? selectedRadio.value : "";

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const repeatedPassword = document.getElementById("repeated-password").value;

    if(!username || !email || !password || !repeatedPassword)
        return showError("Please fill all the fields");

    if(password != repeatedPassword)
        return showError("Passwords don't match");

    const formData = {
        type: selectedType,
        username: username,
        email: email,
        password: password
    };

    if(selectedType === "Esercente") {
        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const pIva = document.getElementById("pIva").value;

        if(!firstName || !lastName || !lastName)
            return showError("Please fill all the fields")
        
        formData.first_name = firstName;
        formData.last_name = lastName;
        formData.p_iva = pIva; 
    }

    submitBtn.disabled = true;

    try {
        const response = await fetch("http://localhost:3000/auth/signUp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.status === 201) {
            showError("worked");
            document.getElementById("signupForm").reset();
            switchUserType("Utente");
            radioUtente.checked = true;
        } else {
            showError(result.message || "An error occurred");
        }
    } catch (error) {
        showError("Could not connect to the server");
        console.error("Fetch Error:", error);
    } finally {
        submitBtn.disabled = false;
    }
});