let selectedCouponId = null;
let selectedCouponCode = null;
let currentUserPoints = 0;

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
const pointsWarning = document.getElementById("pointsWarning");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const couponSidebar = document.getElementById("couponSidebar");
const closeSidebar = document.getElementById("closeSidebar");

shopViewRadio.addEventListener("change", () => {
    if (shopViewRadio.checked) {
        pageTitle.innerText = "Negozio";
        couponGrid.style.display = "grid";
        walletGrid.style.display = "none";
        loadDashboardData();
    }
});

walletViewRadio.addEventListener("change", () => {
    if (walletViewRadio.checked) {
        pageTitle.innerText = "Portafogli";
        couponGrid.style.display = "none";
        walletGrid.style.display = "grid";
        loadWalletData();
    }
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

async function loadDashboardData() {
    userPoints.innerText = "-";
    couponGrid.innerHTML = '<div class="status-message loading-state">Caricamento in corso...</div>';
    
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

        if (redirectToLoginIfUnauthorized(response)) {
            return;
        }

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

        if (redirectToLoginIfUnauthorized(response)) {
            return;
        }

        if (!couponResponse.ok) {
            couponGrid.innerHTML = '<div class="status-message empty-state">Il negozio al momento è vuoto :(</div>';
            return;
        }

        const couponData = await couponResponse.json();
        
        if (!couponData.data || couponData.data.length === 0) {
            couponGrid.innerHTML = '<div class="status-message empty-state">Il negozio al momento è vuoto :(</div>';
        } else {
            couponGrid.innerHTML = "";
            renderCoupons(couponData.data);
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
    coupons.forEach(coupon => {
        const card = document.createElement("div");
        card.className = "coupon-card";
        card.innerHTML = `
            <span class="card-category">${coupon.categoria || 'Generico'}</span>
            <h3 class="card-title">${coupon.titolo}</h3>
            <div class="card-footer">
                <span class="card-cost">${coupon.costoInPunti} Punti</span>
            </div>
        `;
        card.addEventListener("click", () => openSidebar(coupon));
        couponGrid.appendChild(card);
    });
}

function renderWalletCoupons(purchasedCoupons) {
    purchasedCoupons.forEach(item => {
        const coupon = item.couponId || item; 
        const card = document.createElement("div");
        card.className = "coupon-card wallet-card";
        card.innerHTML = `
            <span class="card-category">${coupon.categoria || 'Acquistato'}</span>
            <h3 class="card-title">${coupon.titolo}</h3>
            <div class="card-footer">
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

    sideTitle.innerText = coupon.titolo;
    sideCategory.innerText = coupon.categoria || 'Generico';
    sideDescription.innerText = coupon.descrizione || '';
    sideCost.innerText = coupon.costoInPunti;
    sideExpiration.innerText = coupon.scadenza ? new Date(coupon.scadenza).toLocaleDateString('it-IT') : 'N/A';

    if (currentUserPoints < coupon.costoInPunti) {
        buyBtn.disabled = true;
        pointsWarning.style.display = "block";
    } else {
        buyBtn.disabled = false;
        pointsWarning.style.display = "none";
    }

    sidebarOverlay.classList.add("active");
    couponSidebar.classList.add("active");
}

function closeSidebarAnim() {
    sidebarOverlay.classList.remove("active");
    couponSidebar.classList.remove("active");
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