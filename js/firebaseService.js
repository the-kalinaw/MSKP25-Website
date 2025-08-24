// js/firebaseService.js

// This module is responsible for all communication with the Firestore database.

export async function fetchSeatsData(db, collection, getDocs) {
    const seatsCollection = collection(db, "seats");
    const querySnapshot = await getDocs(seatsCollection);
    const seatsMap = new Map();
    querySnapshot.forEach(doc => {
        seatsMap.set(doc.id, doc.data());
    });
    return seatsMap;
}

/**
 * Creates a new sale record and updates the status of the seats in Firestore.
 * @param {object} db - The Firestore database instance.
 * @param {object} transactionData - The complete data for the transaction.
 * @param {function} writeBatch - The Firestore writeBatch function.
 * @param {function} doc - The Firestore doc function.
 */
export async function confirmSaleInFirebase(db, transactionData, writeBatch, doc) {
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