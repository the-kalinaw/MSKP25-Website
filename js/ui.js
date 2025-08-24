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