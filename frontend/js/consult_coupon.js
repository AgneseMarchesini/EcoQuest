document.addEventListener("DOMContentLoaded", () => {
    let currentUserPoints = 0;
    let selectedCouponId = null;

    const grid = document.getElementById("couponGrid");
    const pointsDisplay = document.getElementById("userPoints");
    const refreshBtn = document.getElementById("refreshBtn");

    const sidebar = document.getElementById("couponSidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const closeBtn = document.getElementById("closeSidebar");
    const buyBtn = document.getElementById("buyBtn");

    const sideTitle = document.getElementById("sideTitle");
    const sideCategory = document.getElementById("sideCategory");
    const sideDescription = document.getElementById("sideDescription");
    const sideCost = document.getElementById("sideCost");
    const sideExpiration = document.getElementById("sideExpiration");
    const pointsWarning = document.getElementById("pointsWarning");

    async function loadDashboardData() {
        try {
            const token = localStorage.getItem("token");
            const userResponse = await fetch("/user/api/punti", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }
            });

            if(!userResponse.ok) {
                throw new Error("Errore nel recupero dei punti dal server.");
            }
            
            const userData = await userResponse.json();
            
            currentUserPoints = userData.currentPoints || 0;
            pointsDisplay.innerText = currentUserPoints;

            const couponResponse = await fetch("/coupon/api/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }
            });

            if(!couponResponse.ok) {
                throw new Error("Errore nel recupero dei punti dal server.");
            }

            const couponData = await couponResponse.json();

            renderCoupons(couponData.data);
        } catch (error) {
            console.error("Errore nel caricamento della dashboard:", error);
        }
    }

    function renderCoupons(coupons) {
        grid.innerHTML = "";

        coupons.forEach(coupon => {
            const card = document.createElement("div");
            card.className = "coupon-card";
            
            const dataScadenza = new Date(coupon.scadenza).toLocaleDateString('it-IT');

            card.innerHTML = `
                <span class="card-category">${coupon.categoria}</span>
                <h3 class="card-title">${coupon.titolo}</h3>
                <div class="card-footer">
                    <span class="card-cost">🪙 ${coupon.costoInPunti} Punti</span>
                    <span>⏳ ${dataScadenza}</span>
                </div>
            `;

            card.addEventListener("click", () => openSidebar(coupon));
            grid.appendChild(card);
        });
    }

    function openSidebar(coupon) {
        selectedCouponId = coupon._id;

        sideTitle.innerText = coupon.titolo;
        sideCategory.innerText = coupon.categoria;
        sideDescription.innerText = coupon.descrizione || "Nessuna descrizione disponibile.";
        sideCost.innerText = coupon.costoInPunti;
        
        const dataScadenza = new Date(coupon.scadenza).toLocaleDateString('it-IT');
        sideExpiration.innerText = dataScadenza;

        if (currentUserPoints >= coupon.costoInPunti) {
            buyBtn.disabled = false;
            pointsWarning.style.display = "none";
        } else {
            buyBtn.disabled = true;
            pointsWarning.style.display = "block";
        }

        sidebar.classList.add("active");
        overlay.classList.add("active");
    }

    function closeSidebarAnim() {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
        selectedCouponId = null;
    }

    // 4. Gestione Acquisto
    async function handlePurchase() {
        if (!selectedCouponId) return;

        try {
            buyBtn.disabled = true;
            buyBtn.innerText = "Elaborazione...";

            // AQUISTA router.POST

            setTimeout(() => {
                alert("🎉 Coupon acquistato con successo!");
                closeSidebarAnim();
                buyBtn.innerText = "Acquista Coupon";
                loadDashboardData(); // Ricarica i dati per aggiornare i punti e la griglia
            }, 1000);

        } catch (error) {
            console.error("Errore durante l'acquisto:", error);
            buyBtn.innerText = "Acquista Coupon";
            buyBtn.disabled = false;
        }
    }

    closeBtn.addEventListener("click", closeSidebarAnim);
    overlay.addEventListener("click", closeSidebarAnim);
    refreshBtn.addEventListener("click", loadDashboardData);
    buyBtn.addEventListener("click", handlePurchase);

    loadDashboardData();
});