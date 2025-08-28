// js/firebaseService.js

// This module is responsible for all communication with the Firestore database.

/**
 * ======================================================
 *                  NEW & IMPROVED
 * ======================================================
 * Sets up a real-time listener on the 'seats' collection.
 * Instead of fetching data once, this will automatically receive updates
 * whenever a seat's status changes on the server.
 *
 * @param {object} db - The Firestore database instance.
 * @param {function} collection - The Firestore collection function.
 * @param {function} onSnapshot - The Firestore onSnapshot function.
 * @param {function} handleDataUpdate - A "callback function" that will be executed
 *                                      every time the data changes. This function
 *                                      will receive the new seatsMap.
 */
export function listenForSeatChanges(db, collection, onSnapshot, handleDataUpdate) {
    const seatsCollection = collection(db, "seats");
    
    // onSnapshot returns an "unsubscribe" function that we can call later if needed
    const unsubscribe = onSnapshot(seatsCollection, (querySnapshot) => {
        const seatsMap = new Map();
        querySnapshot.forEach(doc => {
            seatsMap.set(doc.id, doc.data());
        });
        
        // This is the crucial part: every time the data changes,
        // we call the function that main.js gave us, with the new data.
        handleDataUpdate(seatsMap);
    });

    // We can return the unsubscribe function in case we ever want to stop listening
    return unsubscribe;
}

/**
 * Creates a new sale record and updates the status of the seats in Firestore.
 * @param {object} db - The Firestore database instance.
 * @param {object} transactionData - The complete data for the transaction.
 * @param {function} writeBatch - The Firestore writeBatch function.
 * @param {function} doc - The Firestore doc function.
 */
export async function confirmSaleInFirebase(db, transactionData, writeBatch, doc, collection) {
    // 1. Generate a unique ID for this sale.
    // e.g., "1678886400000-JHS"
    const saleId = `${transactionData.saleTimestamp.getTime()}-${transactionData.moderatorBooth}`;
    const salesCollectionRef = collection(db, "sales");
    const saleDocRef = doc(salesCollectionRef, saleId);

    // 2. Get a reference to the seats collection
    const seatsCollectionRef = collection(db, "seats");

    // 3. Create a batch to perform multiple writes at once (it's all or nothing)
    const batch = writeBatch(db);

    // 4. Command 1: Create the new sale document
    batch.set(saleDocRef, transactionData);

    // 5. Command 2: Update each seat document
    transactionData.seats.forEach(seatId => {
        const seatDocRef = doc(seatsCollectionRef, seatId);
        // Mark the seat as sold AND link it to this sale's ID
        batch.update(seatDocRef, { 
            status: "sold",
            saleId: saleId 
        });
    });

    // 6. Execute all commands in the batch
    await batch.commit();
    console.log(`Successfully created sale ${saleId} and updated seats.`);
}

/**
 * Sets up a real-time listener on the 'sales' collection.
 * It orders the sales by timestamp to show the most recent first.
 *
 * @param {object} db - The Firestore database instance.
 * @param {object} fns - An object containing Firestore functions (collection, onSnapshot, query, orderBy).
 * @param {function} handleSalesUpdate - A callback function to run when sales data changes.
 */
export function listenForSalesChanges(db, fns, handleSalesUpdate) {
    const { collection, onSnapshot, query, orderBy } = fns;
    
    // Create a query to get all documents from the 'sales' collection,
    // ordered by the saleTimestamp field in descending order (newest first).
    const salesQuery = query(collection(db, "sales"), orderBy("saleTimestamp", "desc"));

    const unsubscribe = onSnapshot(salesQuery, (querySnapshot) => {
        const sales = [];
        querySnapshot.forEach(doc => {
            sales.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Pass the array of sales to the callback function
        handleSalesUpdate(sales);
    });

    return unsubscribe;
}

/**
 * Sets up a real-time listener on the 'sponsorships' collection.
 *
 * @param {object} db - The Firestore database instance.
 * @param {object} fns - An object containing Firestore functions (collection, onSnapshot).
 * @param {function} handleUpdate - A callback function to run when sponsorship data changes.
 */
export function listenForSponsorshipChanges(db, fns, handleUpdate) {
    const { collection, onSnapshot } = fns;
    const sponsorshipsCollection = collection(db, "sponsorships");

    const unsubscribe = onSnapshot(sponsorshipsCollection, (querySnapshot) => {
        const packages = [];
        querySnapshot.forEach(doc => {
            packages.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Pass the array of packages to the callback
        handleUpdate(packages);
    });

    return unsubscribe;
}

/**
 * Handles the complex transaction of reserving a sponsorship package.
 * @param {object} db - The Firestore database instance.
 * @param {object} fns - An object containing Firestore functions.
 * @param {object} reservationData - The data for the new reservation.
 */
export async function reserveSponsorshipPackage(db, fns, reservationData) {
    const { collection, doc, writeBatch, serverTimestamp, increment } = fns;

    // 1. Get references to the collections we need to modify
    const reservationsCollection = collection(db, "sponsorshipReservations");
    const sponsorshipsCollection = collection(db, "sponsorships");
    const seatsCollection = collection(db, "seats");

    // 2. Prepare the new reservation document
    const newReservationRef = doc(reservationsCollection); // Create a new doc with an auto-generated ID
    const reservationRecord = {
        sponsorName: reservationData.sponsorName,
        packageId: reservationData.packageId,
        packageName: reservationData.packageName, // Store the name for easy reading
        donationAmount: reservationData.donationAmount,
        assignedSeats: reservationData.assignedSeats,
        reservationTimestamp: serverTimestamp() // Use the server's timestamp for accuracy
    };

    // 3. Get a reference to the sponsorship package document that needs to be updated
    const packageDocRef = doc(sponsorshipsCollection, reservationData.packageId);

    // 4. Create a batch to perform all writes atomically
    const batch = writeBatch(db);

    // Command 1: Create the new reservation document
    batch.set(newReservationRef, reservationRecord);

    // Command 2: Decrement the 'slotsRemaining' for the package
    batch.update(packageDocRef, { slotsRemaining: increment(-1) });

    // Command 3: Update all the assigned seats to be 'sold'
    reservationData.assignedSeats.forEach(seatId => {
        const seatDocRef = doc(seatsCollection, seatId);
        batch.update(seatDocRef, { 
            status: "sold",
            reservationId: newReservationRef.id // Link the seat to the new reservation
        });
    });

    // 5. Execute all commands
    await batch.commit();
    console.log(`Successfully created reservation ${newReservationRef.id}`);
}