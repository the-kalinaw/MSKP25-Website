// js/ui.js

// This module is responsible for all direct DOM manipulation (rendering the UI).

/**
 * Renders the seating chart based on live data from Firebase.
 * @param {HTMLElement} seatingChart - The main container for the seats.
 * @param {Map} seatsMap - The map of seat data fetched from Firebase.
 * @param {object} config - An object containing seatLayout, seatTypes, and seatConfiguration.
 */
export function renderSeats(seatingChart, seatsMap, config) {
    seatingChart.innerHTML = '';
    const { seatLayout, seatTypes, seatConfiguration } = config;
    
    // Logic to create a flat list of all seat numbers for each category
    const numberLists = {
        V: seatConfiguration.find(s => s.sectionName === "VIP/Sponsor").rows.flatMap(r => r.numbers),
        G: seatConfiguration.find(s => s.sectionName === "Ginto").rows.flatMap(r => r.numbers),
        P: seatConfiguration.find(s => s.sectionName === "Pilak").rows.flatMap(r => r.numbers),
        T: seatConfiguration.find(s => s.sectionName === "Tanso").rows.flatMap(r => r.numbers),
        K: seatConfiguration.find(s => s.sectionName === "Intermediate/Primary").rows.flatMap(r => r.numbers),
    };
    const counters = { V: 0, G: 0, P: 0, T: 0, K: 0 };

    seatLayout.forEach(rowString => {
        const seatRow = document.createElement('div');
        seatRow.classList.add('seat-row');
        for (const char of rowString) {
            if (char in seatTypes) {
                const counter = counters[char];
                const seatNum = numberLists[char][counter];
                const seatId = `${char}${seatNum}`;
                const seatData = seatsMap.get(seatId);

                if (!seatData) {
                    console.error(`Render Error: Data for seat ${seatId} not found!`);
                    const spacer = document.createElement('div');
                    spacer.classList.add('spacer');
                    seatRow.appendChild(spacer);
                    counters[char]++;
                    continue; 
                }
                const seat = document.createElement('div');
                seat.classList.add('seat');
                seat.classList.add(`seat-${seatData.category.toLowerCase().split('/')[0]}`);
                seat.classList.add(seatData.status);
                seat.dataset.seatId = seatData.seatId;
                seat.dataset.price = seatData.price;
                seat.innerText = seatData.seatId;
                seatRow.appendChild(seat);
                counters[char]++;
            } else {
                const spacer = document.createElement('div');
                spacer.classList.add('spacer');
                seatRow.appendChild(spacer);
            }
        }
        seatingChart.appendChild(seatRow);
    });
}

/**
 * Renders the seating chart using only local data for simulation mode.
 * @param {HTMLElement} seatingChart - The main container for the seats.
 * @param {object} config - An object containing seatLayout, seatTypes, and seatConfiguration.
 */
export function renderSeatsWithLocalData(seatingChart, config) {
    seatingChart.innerHTML = '';
    const { seatLayout, seatTypes, seatConfiguration } = config;

    const numberLists = {
        V: seatConfiguration.find(s => s.sectionName === "VIP/Sponsor").rows.flatMap(r => r.numbers),
        G: seatConfiguration.find(s => s.sectionName === "Ginto").rows.flatMap(r => r.numbers),
        P: seatConfiguration.find(s => s.sectionName === "Pilak").rows.flatMap(r => r.numbers),
        T: seatConfiguration.find(s => s.sectionName === "Tanso").rows.flatMap(r => r.numbers),
        K: seatConfiguration.find(s => s.sectionName === "Intermediate/Primary").rows.flatMap(r => r.numbers),
    };
    const counters = { V: 0, G: 0, P: 0, T: 0, K: 0 };

    seatLayout.forEach(rowString => {
        const seatRow = document.createElement('div');
        seatRow.classList.add('seat-row');
        for (const char of rowString) {
            if (char in seatTypes) {
                const counter = counters[char];
                const seatNum = numberLists[char][counter];
                const seatId = `${char}${seatNum}`;
                const seatType = seatTypes[char];

                const seat = document.createElement('div');
                seat.classList.add('seat');
                seat.classList.add(`seat-${seatType.category.toLowerCase().split('/')[0]}`);
                seat.classList.add(seatType.status); // Use default status from seatTypes
                
                seat.dataset.seatId = seatId;
                seat.dataset.price = seatType.price;
                seat.innerText = seatId;
                
                seatRow.appendChild(seat);
                counters[char]++;
            } else {
                const spacer = document.createElement('div');
                spacer.classList.add('spacer');
                seatRow.appendChild(spacer);
            }
        }
        seatingChart.appendChild(seatRow);
    });
}


/**
 * Updates the summary section of the UI.
 * @param {HTMLElement} seatingChart - The main container to find selected seats.
 * @param {HTMLElement} countElement - The span for the count.
 * @param {HTMLElement} totalElement - The span for the total.
 */
export function updateSummary(seatingChart, countElement, totalElement, selectedSeatsListElement) {
    const selectedSeatElements = seatingChart.querySelectorAll('.seat.selected');
    
    // 1. Create an array of just the seat IDs (e.g., ['G5', 'G6', 'P12'])
    const selectedSeatIds = Array.from(selectedSeatElements).map(seat => seat.dataset.seatId);

    // 2. Update the list of selected seats in the HTML
    if (selectedSeatIds.length > 0) {
        // Join the array into a comma-separated string and display it
        selectedSeatsListElement.innerText = selectedSeatIds.join(', ');
    } else {
        // If no seats are selected, display 'None'
        selectedSeatsListElement.innerText = 'None';
    }
    
    const count = selectedSeatElements.length;
    const total = Array.from(selectedSeatElements).reduce((sum, seat) => {
        return sum + parseInt(seat.dataset.price);
    }, 0);
    countElement.innerText = count;
    totalElement.innerText = total;
}

/**
 * Displays the sale confirmation modal with the details of the sale.
 * @param {object} saleDetails - An object containing the sold seats' IDs.
 * @param {object} elements - An object containing the modal DOM elements.
 */
export function showConfirmationModal(saleDetails, elements) {
    const { modal, countElement, listElement } = elements;

    // Populate the modal with the correct data from the sale
    countElement.innerText = saleDetails.seats.length;
    listElement.innerText = saleDetails.seats.join(', ');

    // Make the modal visible
    modal.classList.remove('hidden');
}

/**
 * Hides the sale confirmation modal.
 * @param {HTMLElement} modal - The modal element to hide.
 */
export function hideConfirmationModal(modal) {
    modal.classList.add('hidden');
}

/**
 * Updates the entire KPI summary module on the dashboard.
 * @param {object} kpiData - The calculated data for revenue, sales, and categories.
 * @param {object} elements - The DOM elements to update.
 */
export function updateKpiSummary(kpiData, elements) {
    const { totalRevenueEl, totalTicketsSoldEl, categorySummaryTableBodyEl } = elements;

    // Update the main KPI cards
    totalRevenueEl.innerText = `Php ${kpiData.totalRevenue.toLocaleString()}`;
    totalTicketsSoldEl.innerText = kpiData.totalTicketsSold;

    // Clear the existing table body
    categorySummaryTableBodyEl.innerHTML = '';

    // Create and append a new row for each category
    for (const categoryName in kpiData.categoryStats) {
        const stats = kpiData.categoryStats[categoryName];
        const remaining = stats.total - stats.sold;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${categoryName}</td>
            <td>${stats.sold}</td>
            <td>${remaining}</td>
            <td>${stats.total}</td>
        `;
        categorySummaryTableBodyEl.appendChild(row);
    }
}

/**
 * Renders the detailed sales log table on the dashboard.
 * @param {Array<object>} sales - An array of sale objects from Firestore.
 * @param {HTMLElement} tableBodyEl - The tbody element of the sales log table.
 */
export function updateSalesLog(sales, tableBodyEl) {
    // Clear the existing table to prevent duplicates
    tableBodyEl.innerHTML = '';

    // Check if there are any sales
    if (sales.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6">No sales recorded yet.</td>`;
        tableBodyEl.appendChild(row);
        return;
    }

    // Create and append a new row for each sale
    sales.forEach(sale => {
        const row = document.createElement('tr');
        
        // Format the timestamp to a more readable local string
        const timestamp = sale.saleTimestamp.toDate().toLocaleString();
        
        // Join the array of seat IDs into a single string
        const seats = sale.seats.join(', ');

        row.innerHTML = `
            <td>${sale.id}</td>
            <td>${timestamp}</td>
            <td>${sale.moderatorBooth}</td>
            <td>${sale.moderatorName}</td>
            <td>${seats}</td>
            <td>Php ${sale.totalPrice.toLocaleString()}</td>
        `;
        tableBodyEl.appendChild(row);
    });
}

/**
 * Updates the VIP sponsorship availability display on the dashboard.
 * @param {Array<object>} packages - The array of sponsorship packages.
 * @param {object} elements - The DOM elements for the slots display.
 */
export function updateSponsorshipAvailability(packages, elements) {
    const { paglingapSlotsEl, makataoSlotsEl, kapwaSlotsEl } = elements;

    packages.forEach(pkg => {
        const displayText = `${pkg.slotsRemaining} / ${pkg.totalSlots} slots remaining`;

        // Use a simple `if` or `switch` statement for a direct, reliable mapping
        if (pkg.packageName === "Paglingap Package") {
            paglingapSlotsEl.innerText = displayText;
        } else if (pkg.packageName === "Makatao Package") {
            makataoSlotsEl.innerText = displayText;
        } else if (pkg.packageName === "Kapwa Package") {
            kapwaSlotsEl.innerText = displayText;
        }
    });
}

/**
 * Populates the dropdown select menu in the VIP reservation form.
 * @param {Array<object>} packages - The array of sponsorship packages.
 * @param {HTMLElement} selectElement - The <select> DOM element.
 */
export function populatePackageOptions(packages, selectElement) {
    // Clear any existing options except the first "disabled" one
    selectElement.innerHTML = '<option value="" disabled selected>-- Select Package --</option>';

    packages.forEach(pkg => {
        const option = document.createElement('option');
        // The value will be the unique document ID, which we'll need for updates
        option.value = pkg.id; 
        option.innerText = `${pkg.packageName} - Php ${pkg.price}`;
        selectElement.appendChild(option);
    });
}

/**
 * Clears the input fields of the VIP reservation form.
 * @param {HTMLElement} formElement - The <form> DOM element.
 */
export function clearVipForm(formElement) {
    formElement.reset();
}

