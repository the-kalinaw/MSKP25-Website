// js/main.js

// ======================================================
//          IMPORTS
// ======================================================
import { db } from './firebase-init.js'; 
import { collection, doc, getDocs, writeBatch, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

// Login Modal Elements
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const boothSelect = document.getElementById('booth-select');
const nameInput = document.getElementById('name-input');

// App State
let seatsMap = new Map();
let moderatorBooth = '';
let moderatorName = '';

// ======================================================
//                  EVENT HANDLERS
// ======================================================
function handleSeatClick(event) {
    const clickedElement = event.target;
    if (clickedElement.classList.contains('seat') && clickedElement.classList.contains('available')) {
        clickedElement.classList.toggle('selected');
        ui.updateSummary(seatingChart, countElement, totalElement, selectedSeatsListElement);
    }
}

async function handleConfirmSale() {
    const selectedSeatElements = seatingChart.querySelectorAll('.seat.selected');
    if (selectedSeatElements.length === 0) {
        alert('Please select at least one seat to confirm the sale.');
        return;
    }

    // 1. Gather all transaction data
    const transactionData = {
        moderatorBooth: moderatorBooth,
        moderatorName: moderatorName,
        saleTimestamp: new Date(), // Use a real timestamp
        seats: Array.from(selectedSeatElements).map(seat => seat.dataset.seatId),
        totalPrice: parseInt(totalElement.innerText)
    };

    try {
        // 2. Pass the entire transaction object to the service
        await firebase.confirmSaleInFirebase(db, transactionData, writeBatch, doc);
        
        // 3. On success, update the UI
        selectedSeatElements.forEach(seat => {
            seat.classList.remove('selected', 'available');
            seat.classList.add('sold');
        });
        ui.updateSummary(seatingChart, countElement, totalElement, selectedSeatsListElement);

    } catch (error) {
        console.error("Error confirming sale: ", error);
        alert("There was an error processing the sale. Please try again.");
    }
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
    const isSimulating = true; // Use simulation mode for now
    const fullConfig = { seatLayout, seatTypes, seatConfiguration };

    seatingChart.innerHTML = "<h1>Loading seats...</h1>";
    try {
        if (isSimulating) {
            console.warn("--- RUNNING IN SIMULATION MODE ---");
            ui.renderSeatsWithLocalData(seatingChart, fullConfig);
        } else {
            console.log("--- RUNNING IN LIVE MODE ---");
            seatsMap = await firebase.fetchSeatsData(db, collection, getDocs);
            ui.renderSeats(seatingChart, seatsMap, fullConfig);
        }
        
        seatingChart.addEventListener('click', handleSeatClick);
        confirmButton.addEventListener('click', handleConfirmSale);

        console.log("Application ready.");
    } catch (error) {
        console.error("Failed to initialize application:", error);
        seatingChart.innerHTML = "<h1>Error: Could not load seat data.</h1>";
    }
}

// Start the entire application by initializing the login process
initializeLogin();