// js/main.js

// ======================================================
//          IMPORTS
// ======================================================
import { db } from './firebase-init.js'; 
import { collection, doc, getDocs, writeBatch, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { seatTypes, seatLayout, seatConfiguration, seedDatabaseWithSections } from './config.js';
import * as ui from './ui.js';
import * as firebase from './firebaseService.js';

// ======================================================
//      DEVELOPMENT TOOLS
// ======================================================
window.runSeeder = () => seedDatabaseWithSections(db, collection, doc, setDoc);

// ======================================================
//          DOM ELEMENTS & APP STATE
// ======================================================
// Main Application Elements
const appContainer = document.getElementById('app-container');
const seatingChart = document.querySelector('.seating-chart');
const countElement = document.getElementById('count');
const totalElement = document.getElementById('total');
const selectedSeatsListElement = document.getElementById('selected-seats-list');
const confirmButton = document.querySelector('.confirm-sale-btn');
const clearSelectionButton = document.getElementById('clear-selection-btn');

// Login Modal Elements
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const boothSelect = document.getElementById('booth-select');
const nameInput = document.getElementById('name-input');

// --- Confirmation Modal Elements ---
const saleConfirmationModal = document.getElementById('sale-confirmation-modal');
const closeConfirmationButton = document.getElementById('close-confirmation-btn');
const confSeatCount = document.getElementById('conf-seat-count');
const confSeatList = document.getElementById('conf-seat-list');

// App State
let seatsMap = new Map();
let moderatorBooth = '';
let moderatorName = '';

let userSelection = new Set();

// ======================================================
//                  EVENT HANDLERS
// ======================================================
function handleSeatClick(event) {
    const clickedElement = event.target;
    if (clickedElement.classList.contains('seat') && clickedElement.classList.contains('available')) {
        const seatId = clickedElement.dataset.seatId;

        // --- NEW: Manage selection in a Set instead of just the class ---
        if (userSelection.has(seatId)) {
            userSelection.delete(seatId);
            clickedElement.classList.remove('selected');
        } else {
            userSelection.add(seatId);
            clickedElement.classList.add('selected');
        }
        
        ui.updateSummary(seatingChart, countElement, totalElement, selectedSeatsListElement);
    }
}

async function handleConfirmSale() {
    // Convert the Set of selected IDs to an array
    const selectedSeatIds = Array.from(userSelection);

    if (selectedSeatIds.length === 0) {
        alert('Please select at least one seat to confirm the sale.');
        return;
    }

    const transactionData = {
        moderatorBooth: moderatorBooth,
        moderatorName: moderatorName,
        saleTimestamp: new Date(),
        seats: selectedSeatIds,
        totalPrice: parseInt(totalElement.innerText)
    };

    try {
        // --- SIMPLIFIED: Just call the service. The listener will handle the UI update. ---
        await firebase.confirmSaleInFirebase(db, transactionData, writeBatch, doc, collection);
        
        // After a successful sale, show the confirmation modal
        const modalElements = {
            modal: saleConfirmationModal,
            countElement: confSeatCount,
            listElement: confSeatList
        };
        ui.showConfirmationModal(transactionData, modalElements);

    } catch (error) {
        console.error("Error confirming sale: ", error);
        alert("There was an error processing the sale. Please try again.");
    }
}

function handleClearSelection() {
    // 1. Find all currently selected seats
    const selectedSeatElements = seatingChart.querySelectorAll('.seat.selected');
    
    // 2. Loop through them and remove the 'selected' class
    selectedSeatElements.forEach(seat => {
        seat.classList.remove('selected');
    });

    // 3. Call the UI function to update the summary display back to zero
    userSelection.clear(); // Clear the selection Set
    ui.updateSummary(seatingChart, countElement, totalElement, selectedSeatsListElement);
}

// ======================================================
//                  APPLICATION LOGIC
// ======================================================
/**
 * This is our new "callback" function. It will be executed by the listener
 * every time the seat data changes in Firestore.
 */
function handleDataUpdate(newSeatsMap) {
    console.log("Real-time update received!");
    seatsMap = newSeatsMap; // Update our local state

    // Re-render the entire seating chart with the new data
    const fullConfig = { seatLayout, seatTypes, seatConfiguration };
    ui.renderSeats(seatingChart, seatsMap, fullConfig);

    // --- NEW: SAVE TO SESSION CACHE ---
    // Convert the Map to an array that can be stored as a string
    const seatsArray = Array.from(newSeatsMap.entries());
    sessionStorage.setItem('seatsCache', JSON.stringify(seatsArray));
    console.log("Seat cache updated in Session Storage.");
    // ---------------------------------

    userSelection.forEach(seatId => {
        const seatElement = seatingChart.querySelector(`[data-seat-id="${seatId}"]`);
        if (seatElement && seatElement.classList.contains('available')) {
            seatElement.classList.add('selected');
        }
    });

    // Update the summary in case a selected seat was sold by someone else
    ui.updateSummary(seatingChart, countElement, totalElement, selectedSeatsListElement);
}

// ======================================================
//                  INITIALIZATION
// ======================================================
function initializeLogin() {
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Stop the form from reloading the page

        // Store moderator details for the session
        moderatorBooth = boothSelect.value;
        moderatorName = nameInput.value.trim();

        if (moderatorBooth && moderatorName) {
            // Hide the modal and show the app
            loginModal.classList.add('hidden');
            appContainer.classList.remove('hidden');

            // Now, start the main application logic
            loadSeatingChart();
        }
    });
}

async function loadSeatingChart() {
    const fullConfig = { seatLayout, seatTypes, seatConfiguration };
    
    // --- NEW: HYBRID CACHING STRATEGY ---
    const cachedData = sessionStorage.getItem('seatsCache');

    if (cachedData) {
        // 1. If we have cached data, load it instantly.
        console.log("Loading seats from Session Storage cache...");
        const seatsArray = JSON.parse(cachedData);
        seatsMap = new Map(seatsArray);
        ui.renderSeats(seatingChart, seatsMap, fullConfig);
        userSelection.clear(); // Clear any previous selections on a cached load
        ui.updateSummary(seatingChart, countElement, totalElement, selectedSeatsListElement);

    } else {
        // 2. If no cache, show the loading message.
        seatingChart.innerHTML = "<h1>Loading seats for the first time...</h1>";
    }

    // 3. In BOTH cases, start the real-time listener in the background.
    // It will provide the initial data (if the cache was empty) OR
    // it will provide any updates that happened since the cache was saved.
    console.log("Setting up real-time listener...");
    firebase.listenForSeatChanges(db, collection, onSnapshot, handleDataUpdate);
    
    // Attach event listeners that only need to be set once
    confirmButton.addEventListener('click', handleConfirmSale);
    clearSelectionButton.addEventListener('click', handleClearSelection);
    seatingChart.addEventListener('click', handleSeatClick);
    closeConfirmationButton.addEventListener('click', () => {
        ui.hideConfirmationModal(saleConfirmationModal);
    });
}

// Start the entire application by initializing the login process
initializeLogin();