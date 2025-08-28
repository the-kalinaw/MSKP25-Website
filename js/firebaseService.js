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
 * Sets up listeners on BOTH 'sales' and 'sponsorshipReservations' collections.
 * It merges and sorts the results to create a single, chronological transaction log.
 *
 * @param {object} db - The Firestore database instance.
 * @param {object} fns - An object containing Firestore functions.
 * @param {function} handleUpdate - The callback to run with the unified list.
 */
export function listenForAllTransactions(db, fns, handleUpdate) {
    const { collection, onSnapshot, query, orderBy } = fns;

    let sales = [];
    let reservations = [];

    const mergeAndSort = () => {
        // Format regular sales
        const typedSales = sales.map(s => ({
            ...s,
            type: 'Ticket Sale'
        }));

        // Format reservations to match the sales structure
        const typedReservations = reservations.map(r => {
            const data = r.data();
            return {
                id: r.id,
                type: 'Sponsorship',
                moderatorBooth: 'N/A',
                moderatorName: data.sponsorName,
                seats: data.assignedSeats,
                totalPrice: data.donationAmount,
                saleTimestamp: data.reservationTimestamp,
                packageName: data.packageName
            };
        });
        
        const allTransactions = [...typedSales, ...typedReservations];
        // Sort all transactions together by their timestamp
        allTransactions.sort((a, b) => {
            if (!a.saleTimestamp || !b.saleTimestamp) return 0;
            return b.saleTimestamp.toDate() - a.saleTimestamp.toDate();
        });
        
        handleUpdate(allTransactions);
    };

    // Listener for 'sales' collection
    const salesQuery = query(collection(db, "sales"), orderBy("saleTimestamp", "desc"));
    onSnapshot(salesQuery, (snapshot) => {
        sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        mergeAndSort();
    });

    // Listener for 'sponsorshipReservations' collection
    const reservationsQuery = query(collection(db, "sponsorshipReservations"), orderBy("reservationTimestamp", "desc"));
    onSnapshot(reservationsQuery, (snapshot) => {
        reservations = snapshot.docs.map(doc => ({ id: doc.id, data: () => doc.data() }));
        mergeAndSort();
    });
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

/**
 * Updates the details of a specific sale or reservation document in Firestore.
 * @param {object} db - The Firestore database instance.
 * @param {object} fns - An object containing Firestore functions (doc, updateDoc).
 * @param {string} saleId - The ID of the document to update.
 * @param {string} saleType - The type of sale ('Ticket Sale' or 'Sponsorship').
 * @param {object} updatedData - An object containing the fields to update.
 */
export async function updateSaleDetails(db, fns, saleId, saleType, updatedData) {
    const { doc, updateDoc } = fns;

    // Determine which collection the document lives in
    const collectionName = saleType === 'Sponsorship' ? 'sponsorshipReservations' : 'sales';
    const docRef = doc(db, collectionName, saleId);

    // Perform the update
    await updateDoc(docRef, updatedData);
    console.log(`Successfully updated document: ${saleId}`);
}

/**
 * Voids a transaction by deleting the sale record and resetting the seats.
 * If it's a sponsorship, it also increments the available slots.
 * @param {object} db - The Firestore database instance.
 * @param {object} fns - An object containing Firestore functions.
 * @param {object} saleData - The full data object for the sale to be voided.
 */
export async function voidSaleTransaction(db, fns, saleData) {
    const { collection, doc, writeBatch, increment } = fns;

    const batch = writeBatch(db);

    // 1. Determine the collection and document to be deleted
    const isSponsorship = saleData.type === 'Sponsorship';
    const collectionName = isSponsorship ? 'sponsorshipReservations' : 'sales';
    const saleDocRef = doc(db, collectionName, saleData.id);

    // Command 1: Delete the sale/reservation document
    batch.delete(saleDocRef);

    // 2. Reset all associated seats
    if (saleData.seats && saleData.seats.length > 0) {
        saleData.seats.forEach(seatId => {
            const seatDocRef = doc(db, 'seats', seatId);
            // Command to update each seat: set status to available and remove saleId link
            batch.update(seatDocRef, {
                status: 'available',
                saleId: null, // Or use deleteField() for complete removal
                reservationId: null
            });
        });
    }

    // 3. If it was a sponsorship, restore the available slot count
    if (isSponsorship && saleData.packageId) {
        const packageDocRef = doc(db, 'sponsorships', saleData.packageId);
        // Command to increment the slotsRemaining field by 1
        batch.update(packageDocRef, { slotsRemaining: increment(1) });
    }

    // 4. Execute all commands in the batch
    await batch.commit();
    console.log(`Transaction ${saleData.id} successfully voided.`);
}