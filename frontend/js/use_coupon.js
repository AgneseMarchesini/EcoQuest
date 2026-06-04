/**
 * Gestisce la visualizzazione del coupon acquistato pronto per essere utilizzato. 
 * Estrae l'ID dell'acquisto dall'URL, interroga l'endpoint protetto (`/coupon/api/acquistati/:id`) 
 * per ottenere i dettagli del premio (titolo, categoria, codice alfanumerico) e genera dinamicamente 
 * un QR Code scansionabile utilizzando un'API esterna (`api.qrserver.com`), mostrandolo a schermo.
 */

document.addEventListener("DOMContentLoaded", () => {
    const couponTitle = document.getElementById("couponTitle");
    const couponCategory = document.getElementById("couponCategory");
    const qrPlaceholder = document.getElementById("qrPlaceholder");
    const qrCodeImg = document.getElementById("qrCodeImg");
    const couponCodeString = document.getElementById("couponCodeString");
    const backBtn = document.getElementById("backBtn");

    const urlParams = new URLSearchParams(window.location.search);
    const purchaseId = urlParams.get("id");

    if (!purchaseId) {
        alert("ID Coupon mancante.");
        window.location.href = "/coupon";
        return;
    }

    backBtn.addEventListener("click", () => {
        window.location.href = "/coupon";
    });

    async function loadCouponRedeemData() {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "/auth";
                return;
            }

            const response = await fetch(`/coupon/api/acquistati/${purchaseId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }
            });

            if (redirectToLoginIfUnauthorized(response)) {
                return;
            }

            const resData = await response.json();

            if (!response.ok) {
                throw new Error(resData.error || "Impossibile recuperare i dettagli del coupon.");
            }

            const acquisto = resData.data;
            const couponDettagli = acquisto.couponId;

            couponTitle.innerText = couponDettagli.titolo;
            couponCategory.innerText = couponDettagli.categoria || "Generico";
            couponCodeString.innerText = couponDettagli.codice;

            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(couponDettagli.codice)}`;
            
            qrCodeImg.src = qrUrl;
            qrCodeImg.onload = () => {
                qrPlaceholder.style.display = "none";
                qrCodeImg.style.display = "block";
            };

        } catch (error) {
            console.error(error);
            alert("❌ " + error.message);
            window.location.href = "/coupon";
        }
    }

    loadCouponRedeemData();
});