// js/dashboard.js

// ======================================================
//          IMPORTS
// ======================================================
import { db } from './firebase-init.js'; 
import { collection, onSnapshot, query, orderBy, doc, writeBatch, serverTimestamp, increment, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

const viewSaleModal = document.getElementById('view-sale-modal');
const closeViewSaleBtn = document.getElementById('close-view-sale-btn');
const viewSaleDetailsContainer = document.getElementById('view-sale-details');

// ======================================================
//          APPLICATION LOGIC
// ======================================================

let allTransactions = []; // <-- NEW: Store all transactions globally
let sponsorshipPackages = []; // Store the packages globally for access

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
    const elements = { categorySummaryTableBodyEl };
    ui.updateCategorySummary(kpiData, elements); 
}

function handleAllTransactionsUpdate(transactions) {
    allTransactions = transactions;
    console.log("Unified transaction update received!");

    // --- 1. Calculate KPIs directly from the transaction list ---
    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.totalPrice, 0);
    const totalTicketsSold = transactions.reduce((sum, tx) => sum + (tx.seats ? tx.seats.length : 0), 0);
    
    const categoryStats = {
        'Ginto': { sold: 0, total: 0 },
        'Pilak': { sold: 0, total: 0 },
        'Tanso': { sold: 0, total: 0 },
        'VIP/Sponsor': { sold: 0, total: 0 },
        'Intermediate/Primary': { sold: 0, total: 0 }
    };

    // Get the total counts from our config file
    seatConfiguration.forEach(section => {
        const category = section.sectionName;
        if (categoryStats[category]) {
            section.rows.forEach(row => {
                categoryStats[category].total += row.numbers.length;
            });
        }
    });

    // Calculate the 'sold' count from the transactions
    transactions.forEach(tx => {
        tx.seats.forEach(seatId => {
            if (seatId.startsWith('G')) categoryStats['Ginto'].sold++;
            else if (seatId.startsWith('P')) categoryStats['Pilak'].sold++;
            else if (seatId.startsWith('T')) categoryStats['Tanso'].sold++;
            else if (seatId.startsWith('V')) categoryStats['VIP/Sponsor'].sold++;
            else if (seatId.startsWith('K')) categoryStats['Intermediate/Primary'].sold++;
        });
    });

    // --- 2. Update all UI components ---
    totalRevenueEl.innerText = `Php ${totalRevenue.toLocaleString()}`;
    totalTicketsSoldEl.innerText = totalTicketsSold;
    ui.updateCategorySummary({ categoryStats }, { categorySummaryTableBodyEl });
    ui.updateSalesLog(transactions, salesLogTableBodyEl);
}

// --- Callback for sponsorship data updates ---
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

function handleSalesLogClick(event) {
    const target = event.target;
    const saleId = target.dataset.saleId;

    // If the click wasn't on a button with an ID, do nothing.
    if (!saleId) return;

    // Define saleData here, in the function's top-level scope.
    const saleData = allTransactions.find(tx => tx.id === saleId);
    
    // If for some reason we can't find the data, stop.
    if (!saleData) {
        console.error("Could not find sale data for ID:", saleId);
        return;
    }
    
    // Check if a 'View' button was clicked
    if (target.classList.contains('view-sale-btn')) {
        
        if (saleData) {
            const modalElements = {
                modal: viewSaleModal,
                detailsContainer: viewSaleDetailsContainer
            };
            ui.displaySaleDetails(saleData, modalElements);
        } else {
            console.error("Could not find sale data for ID:", saleId);
        }
    }
    
    // If a 'Delete' button was clicked...
    if (target.classList.contains('delete-sale-btn')) {
        // 1. Show a confirmation dialog to prevent accidental deletion
        const isConfirmed = confirm(
            `Are you sure you want to delete this transaction?\n\n` +
            `Sale ID: ${saleData.id}\n` +
            `Seats: ${saleData.seats.join(', ')}\n\n` +
            `This action cannot be undone and will make the seats available again.`
        );

        // 2. If the user cancels, stop the function
        if (!isConfirmed) {
            return;
        }

        // 3. If confirmed, call the Firebase service to perform the deletion
        try {
            const firestoreFns = { collection, doc, writeBatch, increment };
            firebase.voidSaleTransaction(db, firestoreFns, saleData);

            alert("Transaction successfully voided.");
            // Note: We don't need to update the UI manually. The real-time listener will do it for us.
            
        } catch (error) {
            console.error("Error voiding transaction:", error);
            alert("There was an error voiding the transaction. Please check the console.");
        }
    }
}

async function handleEditSaleSubmit(event) {
    event.preventDefault(); // Stop the form from reloading the page
    
    const form = event.target;
    const saleId = form.dataset.saleId;
    const saleType = form.dataset.saleType;

    // 1. Prepare the object with the updated data from the form fields
    const updatedData = {};
    if (saleType === 'Sponsorship') {
        updatedData.sponsorName = form.querySelector('#edit-moderator-name').value;
        updatedData.donationAmount = parseInt(form.querySelector('#edit-total-price').value);
    } else { // It's a 'Ticket Sale'
        updatedData.moderatorName = form.querySelector('#edit-moderator-name').value;
        updatedData.moderatorBooth = form.querySelector('#edit-booth').value;
        updatedData.totalPrice = parseInt(form.querySelector('#edit-total-price').value);
    }

    // 2. Call the Firebase service to save the changes
    try {
        const firestoreFns = { doc, updateDoc };
        await firebase.updateSaleDetails(db, firestoreFns, saleId, saleType, updatedData);
        
        alert('Sale details updated successfully!');
        ui.hideViewSaleModal(viewSaleModal);
    } catch (error) {
        console.error("Error updating sale details:", error);
        alert("There was an error saving the changes. Please check the console.");
    }
}

// ======================================================
//                  INITIALIZATION
// ======================================================
function main() {
    console.log("Dashboard Initializing...");
    const firestoreFns = { collection, onSnapshot, query, orderBy };
    
    // Start listening for all three data sources
    firebase.listenForAllTransactions(db, firestoreFns, handleAllTransactionsUpdate);
    // --- Start listening for sponsorship changes ---
    firebase.listenForSponsorshipChanges(db, firestoreFns, handleSponsorshipDataUpdate);

    vipReservationFormEl.addEventListener('submit', handleVipReservationSubmit);

    salesLogTableBodyEl.addEventListener('click', handleSalesLogClick);
    closeViewSaleBtn.addEventListener('click', () => {
        ui.hideViewSaleModal(viewSaleModal);
    });

    viewSaleModal.addEventListener('submit', handleEditSaleSubmit);
}
main();
