// Global values
let money = 0;
let clickPower = 1;
let clickUpgradeLevel = 0;
let maxBusinessSlots = 10;
let ownedBusinesses = [];
let totalIncomePerSecond = 0;

// Upgrade Constants
const businessUpgradeStart = 25.00;
const businessIncMult = 1.18;
const businessCostMult = 1.13;
const clickPowerMult = 1.18;
const clickCostMult = 1.20;
const upgradeCap = 20;

// Initial click upgrade cost
let clickUpgradeCost = 25.00;

// DOM elements
const moneyDisplay = document.getElementById('money');
const clickButton = document.getElementById('clickButton');
const clickPowerDisplay = document.getElementById('clickPower');
const clickUpgradeCostDisplay = document.getElementById('clickUpgradeCost');
const upgradeClickButton = document.getElementById('upgradeClick');

const slotsUsedDisplay = document.getElementById('slotsUsed');
const maxSlotsDisplay = document.getElementById('maxSlots');
const totalIPSDisplay = document.getElementById('totalIPS');

// Available businesses
const availableBusinessTypes = [
    {
        id: "lemonade",
        name: "Lemonade Stand",
        baseCost: 500.00,
        baseIncome: 0.10,
        description: "Classic street-side refreshment stand",
        color: "warning"
    },
    {
        id: "delivery",
        name: "Delivery Fleet",
        baseCost: 5000.00,
        baseIncome: 0,
        description: "Manage a fleet for fast deliveries.",
        color: "primary"
    }
];

// Delivery Fleet Models
const deliveryVehicleModels = [
    { tier: "Budget", name: "Roller Skates", cost: 300.00, income: 0.30, range: 3600 },    // 1h
    { tier: "Budget", name: "Bike", cost: 500.00, income: 0.50, range: 7200 },           // 2h
    { tier: "Budget", name: "Scooter", cost: 750.00, income: 0.65, range: 10800 },       // 3h
    { tier: "Entry", name: "Motorcycle", cost: 1750.00, income: 1.90, range: 14400 },    // 4h
    { tier: "Entry", name: "Compact Car", cost: 3000.00, income: 2.90, range: 18000 },   // 5h
    { tier: "Entry", name: "Sedan", cost: 4200.00, income: 4.75, range: 21600 }         // 6h
];

// Click for income button
clickButton.addEventListener('click', () => {
    money += clickPower;
    updateAllDisplays();
});

// Upgrade click button
upgradeClickButton.addEventListener('click', () => {
    if (money >= clickUpgradeCost) {
        money -= clickUpgradeCost;
        clickUpgradeLevel++;
        clickPower *= clickPowerMult;
        clickUpgradeCost = Math.round(clickUpgradeCost * clickCostMult * 100) / 100;
        updateAllDisplays();
    }
});

// Update button state
function updateUpgradeButton() {
    if (money >= clickUpgradeCost) {
        upgradeClickButton.classList.remove('btn-secondary');
        upgradeClickButton.classList.add('btn-success');
        upgradeClickButton.disabled = false;
    } else {
        upgradeClickButton.classList.remove('btn-success');
        upgradeClickButton.classList.add('btn-secondary');
        upgradeClickButton.disabled = true;
    }
}

// Render available businesses
function renderAvailableBusinesses() {
    const container = document.getElementById('availableBusinessesList');
    container.innerHTML = '';

    availableBusinessTypes.forEach(biz => {
        const ownedCount = ownedBusinesses.filter(b => b.type === biz.id).length;
        const canAfford = money >= biz.baseCost;
        const hasSlot = ownedBusinesses.length < maxBusinessSlots;

        const card = `
            <div class="col">
                <div class="card h-100 border-${biz.color} shadow-sm">
                    <div class="card-body text-center d-flex flex-column justify-content-between">
                        <div>
                            <h5 class="card-title">${biz.name}</h5>
                            <p class="card-text text-muted">${biz.description}</p>
                            <p><strong>Cost:</strong> $${biz.baseCost.toFixed(2)}</p>
                            <p><strong>Income:</strong> $${biz.baseIncome.toFixed(2)}/sec</p>
                            <p><strong>Owned:</strong> ${ownedCount}</p>
                        </div>
                        <button class="btn btn-${biz.color} btn-lg mt-3"
                                onclick="buyBusiness('${biz.id}')"
                                ${!(canAfford && hasSlot) ? 'disabled' : ''}>
                            Buy
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// Buy business
function buyBusiness(typeId) {
    const bizType = availableBusinessTypes.find(b => b.id === typeId);
    if (!bizType) return;

    if (money >= bizType.baseCost && ownedBusinesses.length < maxBusinessSlots) {
        money -= bizType.baseCost;

        const newBiz = {
            type: typeId,
            customName: bizType.name + " #" + (ownedBusinesses.filter(b => b.type === typeId).length + 1),
            level: 0,
            incomePerSec: bizType.baseIncome,
            upgradeCost: businessUpgradeStart,
            baseIncome: bizType.baseIncome,
            purchaseTime: Date.now(),
            totalEarned: 0
        };

        if (typeId === 'delivery') {
            newBiz.fleet = [];
            newBiz.fleetSlots = 5;
        }

        ownedBusinesses.push(newBiz);

        updateAllDisplays();
        renderOwnedBusinesses();
    }
}

// Update all displays
function updateAllDisplays() {
    moneyDisplay.textContent = `Money: $${money.toFixed(2)}`;
    slotsUsedDisplay.textContent = ownedBusinesses.length;
    clickPowerDisplay.textContent = clickPower.toFixed(2);
    clickUpgradeCostDisplay.textContent = clickUpgradeCost.toFixed(2);

    updateTotalIPS();
    updateUpgradeButton();
    renderOwnedBusinesses();
}

// Upgrade business
function upgradeBusiness(index) {
    const biz = ownedBusinesses[index];
    if (biz.type === 'delivery') return; // Show nothing for Delivery Fleet (and others that aren't upgraded)
    if (biz.level >= upgradeCap || money < biz.upgradeCost) return;

    money -= biz.upgradeCost;
    biz.level++;
    biz.incomePerSec = biz.baseIncome * Math.pow(businessIncMult, biz.level);
    biz.upgradeCost = Math.round(biz.upgradeCost * businessCostMult * 100) / 100;

    updateAllDisplays();
}

// Sell business
function sellBusiness(index) {
    const biz = ownedBusinesses[index];
    const bizType = availableBusinessTypes.find(t => t.id === biz.type);
    const displayName = biz.customName || bizType.name;

    if (!confirm(`Sell ${displayName} (Level ${biz.level})?\nYou will receive 50% of purchase price and 75% of upgrade costs.`)) {
        return;
    }

    const baseRecoup = bizType.baseCost * 0.5;

    let upgradeSpent = 0;
    let tempCost = businessUpgradeStart;
    for (let i = 1; i <= biz.level; i++) {
        upgradeSpent += tempCost;
        tempCost = Math.round(tempCost * businessCostMult * 100) / 100;
    }
    const upgradeRecoup = upgradeSpent * 0.75;

    const totalSellPrice = Math.round((baseRecoup + upgradeRecoup) * 100) / 100;

    money += totalSellPrice;
    ownedBusinesses.splice(index, 1);

    updateAllDisplays();
    alert(`Sold ${displayName} for $${totalSellPrice.toFixed(2)}!`);
}

// Render owned businesses
function renderOwnedBusinesses() {
    const container = document.getElementById('ownedBusinessesContainer');
    container.innerHTML = '';

    if (ownedBusinesses.length === 0) {
        container.innerHTML = `<div class="col-12 text-center text-muted py-5"><p class="fs-4">No businesses yet!</p><p>Click the button below to browse and buy your first one.</p></div>`;
        return;
    }

    ownedBusinesses.forEach((biz, index) => {
        const bizType = availableBusinessTypes.find(t => t.id === biz.type);

        const card = `
            <div class="col">
                <div class="card h-100 shadow-sm clickable-card" onclick="openBusinessDetail(${index})" style="cursor: pointer;">
                    <div class="card-header bg-${biz.type === 'lemonade' ? 'warning' : 'primary'} text-white text-center">
                        <h6 class="mb-0">${biz.customName || bizType.name + " #" + (index + 1)}</h6>
                        <small class="text-white-50">${bizType.name}</small>
                    </div>
                    <div class="card-body text-center py-4">
                        ${biz.type !== 'delivery' ? `<p class="mb-2 fs-5"><strong>Lv ${biz.level}</strong></p>` : ''}
                        ${biz.type === 'delivery' ? `<p class="mb-2 fs-5"><strong>Fleet: ${biz.fleet.length}/${biz.fleetSlots}</strong></p>` : ''}
                        <p class="mb-0 text-success fs-4">$${biz.incomePerSec.toFixed(2)}/sec</p>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// Browse businesses modal
document.getElementById('browseBusinesses').addEventListener('click', () => {
    renderAvailableBusinesses();
    const modalEl = document.getElementById('availableBusinessesModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.removeEventListener('hidden.bs.modal', returnFocus);
    modalEl.addEventListener('hidden.bs.modal', returnFocus);
});

function returnFocus() {
    document.getElementById('browseBusinesses').focus();
}

// Detail modal instance
let detailModalInstance = null;
let currentDetailIndex = -1;

function openBusinessDetail(index) {
    currentDetailIndex = index;
    const biz = ownedBusinesses[index];
    const bizType = availableBusinessTypes.find(t => t.id === biz.type);

    // Header name
    document.getElementById('detailName').textContent = biz.customName || bizType.name + " #" + (index + 1);

    // Income (always shown)
    document.getElementById('detailIncome').textContent = `$${biz.incomePerSec.toFixed(2)}`;

    // Level - Only show for lemonade (not delivery)
    const levelEl = document.getElementById('detailLevel');
    if (biz.type !== 'delivery') {
        levelEl.textContent = `${biz.level}/20`;
    } else {
        levelEl.textContent = '';  // Blank for delivery
    }

    // Calculate upgradeSpent (used for invested/value)
    let upgradeSpent = 0;
    let tempCost = businessUpgradeStart;
    for (let i = 1; i <= biz.level; i++) {
        upgradeSpent += tempCost;
        tempCost = Math.round(tempCost * businessCostMult * 100) / 100;
    }
    const totalInvested = bizType.baseCost + upgradeSpent;
    document.getElementById('detailInvested').textContent = `$${totalInvested.toFixed(2)}`;
    document.getElementById('detailEarned').textContent = `$${biz.totalEarned.toFixed(2)}`;

    // Current sell value
    const baseRecoup = bizType.baseCost * 0.5;
    const upgradeRecoup = upgradeSpent * 0.75;
    const currentValue = Math.round((baseRecoup + upgradeRecoup) * 100) / 100;
    document.getElementById('detailValue').textContent = `$${currentValue.toFixed(2)}`;

    // Net Profit & Profit %
    const netProfit = biz.totalEarned + currentValue - totalInvested;
    const netProfitEl = document.getElementById('detailNetProfit');
    netProfitEl.textContent = netProfit >= 0 ? `+$${netProfit.toFixed(2)}` : `-$${Math.abs(netProfit).toFixed(2)}`;
    netProfitEl.className = netProfit >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold';

    const profitPercent = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
    const profitPercentEl = document.getElementById('detailProfitPercent');
    profitPercentEl.textContent = profitPercent >= 0 ? `+${profitPercent.toFixed(1)}%` : `${profitPercent.toFixed(1)}%`;
    profitPercentEl.className = profitPercent >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold';

    // Upgrade Section - Only for lemonade (not delivery)
    const upgradeSection = document.getElementById('upgradeSection');
    if (biz.type !== 'delivery') {
        if (biz.level < upgradeCap) {
            const canUpgrade = money >= biz.upgradeCost;
            upgradeSection.innerHTML = `
                <button class="btn btn-success btn-lg" ${!canUpgrade ? 'disabled' : ''} id="detailUpgradeBtn">
                    Upgrade ($${biz.upgradeCost.toFixed(2)})
                </button>
                <p class="mt-2 text-muted small">Next level income: $${(biz.incomePerSec * businessIncMult).toFixed(2)}/sec</p>
            `;
            document.getElementById('detailUpgradeBtn').onclick = () => {
                upgradeBusiness(index);
                openBusinessDetail(index);
            };
        } else {
            upgradeSection.innerHTML = `<span class="badge bg-success fs-4 px-4 py-3">MAX LEVEL</span>`;
        }
    } else {
        upgradeSection.innerHTML = ''; // Hide upgrade section for delivery
    }

    // Sell preview
    document.getElementById('sellPreview').textContent = 
        `Sell for $${currentValue.toFixed(2)} (50% of purchase + 75% of $${upgradeSpent.toFixed(2)} in upgrades)`;

    document.getElementById('sellButton').onclick = () => {
        sellBusiness(index);
        detailModalInstance?.hide();
    };

    // Rename
    document.getElementById('renameButton').onclick = () => {
        const newName = prompt("Enter new name:", biz.customName || bizType.name);
        if (newName && newName.trim()) {
            biz.customName = newName.trim();
            renderOwnedBusinesses();
            document.getElementById('detailName').textContent = biz.customName;
        }
    };

    // Delivery Fleet Section
    const fleetSection = document.getElementById('fleetSection');
    if (biz.type === 'delivery') {
        fleetSection.style.display = 'block';
        document.getElementById('detailFleetSlots').textContent = `${biz.fleet.length}/${biz.fleetSlots}`; // Show current/max

        const fleetList = document.getElementById('fleetList');
        fleetList.innerHTML = '';
        if (biz.fleet.length === 0) {
            fleetList.innerHTML = '<p class="text-muted">No vehicles yet. Buy some!</p>';
        } else {
            biz.fleet.forEach(v => {
                fleetList.innerHTML += `
                    <div class="list-group-item">
                        <strong>${v.name}</strong> (${v.tier})<br>
                        Income: $${v.income.toFixed(2)}/sec<br>
                        Range left: ${v.range.toFixed(0)} km
                    </div>
                `;
            });
        }

        document.getElementById('buyCarBtn').onclick = () => {
            if (biz.fleet.length >= biz.fleetSlots) {
                alert('No slots available! Expand first.');
                return;
            }
            const promptText = deliveryVehicleModels.map((m, i) => 
                `${i+1}. ${m.name} ($${m.cost}, $${m.income}/sec, ${m.range / 3600}h)`
            ).join("\n");
            const input = prompt(`Choose model (1-${deliveryVehicleModels.length}):\n${promptText}`);
            const modelIndex = parseInt(input) - 1;
            if (isNaN(modelIndex) || modelIndex < 0 || modelIndex >= deliveryVehicleModels.length) {
                alert('Invalid choice!');
                return;
            }
            const model = deliveryVehicleModels[modelIndex];
            if (money < model.cost) {
                alert('Not enough money!');
                return;
            }
            money -= model.cost;
            biz.fleet.push({ ...model, range: model.range });
            biz.incomePerSec += model.income;
            updateAllDisplays();
            openBusinessDetail(index);
        };

        document.getElementById('expandSlotsBtn').onclick = () => {
            if (money < 1000) {
                alert("Can't afford expansion ($1,000)!");
                return;
            }
            money -= 1000;
            biz.fleetSlots += 5;
            updateAllDisplays();
            openBusinessDetail(index);
        };
    } else {
        fleetSection.style.display = 'none';
    }

    // Show modal
    const modalEl = document.getElementById('businessDetailModal');
    if (!detailModalInstance) {
        detailModalInstance = new bootstrap.Modal(modalEl);
    }
    detailModalInstance.show();

    modalEl.addEventListener('hidden.bs.modal', () => {
        document.body.classList.remove('modal-open');
        document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
    }, { once: true });
}

// Update total IPS
function updateTotalIPS() {
    totalIncomePerSecond = 0;
    for (let i = 0; i < ownedBusinesses.length; i++) {
        totalIncomePerSecond += ownedBusinesses[i].incomePerSec;
    }
    totalIPSDisplay.textContent = totalIncomePerSecond.toFixed(2);
}

// Passive income tick
setInterval(() => {
    if (totalIncomePerSecond > 0) {
        money += totalIncomePerSecond;

        const earnedThisTick = totalIncomePerSecond;
        ownedBusinesses.forEach(biz => {
            if (biz.type === 'delivery') {
                biz.fleet = biz.fleet.filter(vehicle => {
                    vehicle.range -= 1;
                    if (vehicle.range <= 0) {
                        const displayName = biz.customName || "Delivery Fleet";
                        alert(`${vehicle.name} in ${displayName} has retired!`);
                        return false;
                    }
                    return true;
                });
                biz.incomePerSec = biz.fleet.reduce((sum, v) => sum + v.income, 0);
            }
            biz.totalEarned += (biz.incomePerSec / totalIncomePerSecond) * earnedThisTick || 0;
        });

        updateAllDisplays();
    }
}, 1000);

// Initial setup
maxSlotsDisplay.textContent = maxBusinessSlots;
slotsUsedDisplay.textContent = '0';
clickPowerDisplay.textContent = clickPower.toFixed(2);
clickUpgradeCostDisplay.textContent = clickUpgradeCost.toFixed(2);

updateTotalIPS();
updateUpgradeButton();

renderOwnedBusinesses();




