// js/dashboard.js

// ======================================================
//          IMPORTS
// ======================================================
import { db } from './firebase-init.js'; 
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { seatConfiguration } from './config.js'; // We need the totals from config
import * as ui from './ui.js';
import * as firebase from './firebaseService.js';

// ======================================================
//          DOM ELEMENTS
// ======================================================
const totalRevenueEl = document.getElementById('total-revenue');
const totalTicketsSoldEl = document.getElementById('total-tickets-sold');
const categorySummaryTableBodyEl = document.querySelector('#category-summary-table tbody');

const salesLogTableBodyEl = document.querySelector('#sales-log-table tbody');

const paglingapSlotsEl = document.getElementById('paglingap-slots');
const makataoSlotsEl = document.getElementById('makatao-slots');
const kapwaSlotsEl = document.getElementById('kapwa-slots');
const packageSelectEl = document.getElementById('package-select');

const vipReservationFormEl = document.getElementById('vip-reservation-form');
const sponsorNameEl = document.getElementById('sponsor-name');
const donationAmountEl = document.getElementById('donation-amount');
const assignedSeatsEl = document.getElementById('assigned-seats');

// ======================================================
//          APPLICATION LOGIC
// ======================================================

/**
 * The callback function that runs every time the seat data changes.
 * It calculates all KPIs and calls the UI function to update the display.
 * @param {Map} seatsMap - The new map of all seat data from Firestore.
 */
function handleSeatDataUpdate(seatsMap) {
    const kpiData = {
        totalRevenue: 0,
        totalTicketsSold: 0,
        categoryStats: {
            'Ginto': { sold: 0, total: 0 },
            'Pilak': { sold: 0, total: 0 },
            'Tanso': { sold: 0, total: 0 },
            // Add other categories as needed
        }
    };

    // First, get the total number of seats per category from our config file
    seatConfiguration.forEach(section => {
        const category = section.sectionName.split('/')[0]; // Handle 'Kids/Primary'
        if (kpiData.categoryStats[category]) {
            section.rows.forEach(row => {
                kpiData.categoryStats[category].total += row.numbers.length;
            });
        }
    });

    // Now, calculate the live sales data from the seatsMap
    for (const seat of seatsMap.values()) {
        if (seat.status === 'sold') {
            kpiData.totalTicketsSold++;
            kpiData.totalRevenue += seat.price;
            
            const category = seat.category.split('/')[0];
            if (kpiData.categoryStats[category]) {
                kpiData.categoryStats[category].sold++;
            }
        }
    }
    
    // Pass the calculated data to the UI module to be rendered
    const elements = { totalRevenueEl, totalTicketsSoldEl, categorySummaryTableBodyEl };
    ui.updateKpiSummary(kpiData, elements);
}

// --- Callback for sales data updates ---
function handleSalesDataUpdate(sales) {
    console.log("Sales log update received!");
    ui.updateSalesLog(sales, salesLogTableBodyEl);
}

// --- Callback for sponsorship data updates ---
let sponsorshipPackages = []; // Store the packages globally for access
function handleSponsorshipDataUpdate(packages) {   
    console.log("Sponsorship data update received!");
    sponsorshipPackages = packages; // Update our global store
    const availabilityElements = { paglingapSlotsEl, makataoSlotsEl, kapwaSlotsEl };
    ui.updateSponsorshipAvailability(packages, availabilityElements);
    ui.populatePackageOptions(packages, packageSelectEl);
}

async function handleVipReservationSubmit(event) {
    event.preventDefault(); // Stop the page from reloading

    // 1. Gather the data from the form
    const sponsorName = sponsorNameEl.value.trim();
    const packageId = packageSelectEl.value;
    const donationAmount = parseInt(donationAmountEl.value);
    
    // 2. Clean up and validate the assigned seats input
    const assignedSeats = assignedSeatsEl.value
        .trim()
        .toUpperCase()
        .split(',')
        .map(s => s.trim()) // Remove extra spaces
        .filter(s => s); // Remove any empty entries

    if (!sponsorName || !packageId || !donationAmount || assignedSeats.length === 0) {
        alert("Please fill out all fields, including assigned seats.");
        return;
    }

    // 3. Find the full package details from our stored data
    const selectedPackage = sponsorshipPackages.find(p => p.id === packageId);
    if (selectedPackage.slotsRemaining <= 0) {
        alert(`No more slots available for the ${selectedPackage.packageName}.`);
        return;
    }

    // 4. Create the reservation data object
    const reservationData = {
        sponsorName,
        packageId,
        packageName: selectedPackage.packageName,
        donationAmount,
        assignedSeats
    };
    
    // 5. Call the Firebase service to execute the transaction
    try {
        const firestoreFns = { collection, doc, writeBatch, serverTimestamp, increment };
        await firebase.reserveSponsorshipPackage(db, firestoreFns, reservationData);
        
        alert("Sponsorship reservation confirmed successfully!");
        ui.clearVipForm(vipReservationFormEl); // Clear the form on success
    } catch (error) {
        console.error("Error reserving sponsorship:", error);
        alert("There was an error saving the reservation. Please check the console and try again.");
    }
}

// ======================================================
//                  INITIALIZATION
// ======================================================
function main() {
    console.log("Dashboard Initializing...");
    const firestoreFns = { collection, onSnapshot, query, orderBy };
    
    // Start listening for all three data sources
    firebase.listenForSeatChanges(db, collection, onSnapshot, handleSeatDataUpdate);
    firebase.listenForSalesChanges(db, firestoreFns, handleSalesDataUpdate);
    // --- Start listening for sponsorship changes ---
    firebase.listenForSponsorshipChanges(db, firestoreFns, handleSponsorshipDataUpdate);

    vipReservationFormEl.addEventListener('submit', handleVipReservationSubmit);

}
main();