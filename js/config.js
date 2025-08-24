// ======================================================
//                   VENUE CONFIGURATION
// ======================================================
// This configuration is the master blueprint for our venue. It's used for two things:
// 1. To run the one-time database seeder function (seedDatabaseWithLayout).
// 2. To render the visual layout in the correct order on the webpage.

export const seatTypes = {
    'V': { price: 0, category: 'VIP/Sponsor', status: 'available' },
    'G': { price: 600, category: 'Ginto', status: 'available' },
    'P': { price: 500, category: 'Pilak', status: 'available' },
    'T': { price: 400, category: 'Tanso', status: 'available' },
    'K': { price: 0, category: 'Intermediate/Primary', status: 'sold' }
};

export const seatLayout = [
    "GGGGGVVVVV-VVVVVVVVVV-VVVVVVVVVV-VVVVVGGGGG",
    "GGGGGVVVVV-VVVVVVVVVV-VVVVVVVVVV-VVVVVGGGGG",
    "GGGGGGGGGG-VVVVVVVVVV-VVVVVVVVVV-GGGGGGGGGG",
    "GGGGGGGGGG-VVVVVVVVVV-VVVVVVVVVV-GGGGGGGGGG",
    "GGGGGGGGGG-GGGGGGGGGG-GGGGGGGGGG-GGGGGGGGGG",
    "PPPPPPPPPP-GGGGGGGGGG-GGGGGGGGGG-PPPPPPPPPP",
    "PPPPPPPPPP-GGGGGGGGGG-GGGGGGGGGG-PPPPPPPPPP",
    "PPPPPPPPPP-PPPPPPPPPP-PPPPPPPPPP-PPPPPPPPPP",
    "PPPPPPPPPP-PPPPPPPPPP-PPPPPPPPPP-PPPPPPPPPP",
    "-----------PPPPPPPPPP-PPPPPPPPPP-----------",
    "TTTTTTTTTT-----------------------TTTTTTTTTT",
    "TTTTTTTTTT-TTTTTTTTTT-TTTTTTTTTT-TTTTTTTTTT",
    "TTTTTTTTTT-TTTTTTTTTT-TTTTTTTTTT-TTTTTTTTTT",
    "TTTTTTTTTT-TTTTTTTTTT-TTTTTTTTTT-TTTTTTTTTT",
    "TTTTTTTTTT-TTTTTTTTTT-TTTTTTTTTT-TTTTTTTTTT",
    "TTTTTTTTTT-TTTTTTTTTT-TTTTTTTTTT-TTTTTTTTTT",
    "TTTTTTTTTT-TTTTTTTTTT-TTTTTTTTTT-TTTTTTTTTT",
    "-----------TTTTTTTTTT-TTTTTTTTTT-----------",
    "KKKKKKKKKK-----------------------KKKKKKKKKK",
    "KKKKKKKKKK-----------------------KKKKKKKKKK",
];

export const seatConfiguration = [
    {
        sectionName: "VIP/Sponsor",
        rows: [
            { category: 'V', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] }, 
            { category: 'V', numbers: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60] },
            { category: 'V', numbers: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80] },
            { category: 'V', numbers: [81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100] },
        ]
    },
    {
        sectionName: "Ginto",
        rows: [
            { category: 'G', numbers: [1, 2, 3, 4, 5, 101, 102, 103, 104, 105] },
            { category: 'G', numbers: [6, 7, 8, 9, 10, 106, 107, 108, 109, 110] },
            { category: 'G', numbers: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120] },
            { category: 'G', numbers: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130] },
            { category: 'G', numbers: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140] },
            { category: 'G', numbers: [51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90] },
            { category: 'G', numbers: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100] },
        ]
    },
    {
        sectionName: "Pilak",
        rows: [
            { category: 'P', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110] },
            { category: 'P', numbers: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120] },
            { category: 'P', numbers: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130] },
            { category: 'P', numbers: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140] },
            { category: 'P', numbers: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100] },
        ]
    },
    {
        sectionName: "Tanso",
        rows: [
            { category: 'T', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220] },
            { category: 'T', numbers: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230] },
            { category: 'T', numbers: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240] },
            { category: 'T', numbers: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250] },
            { category: 'T', numbers: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260] },
            { category: 'T', numbers: [51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270] },
            { category: 'T', numbers: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280] },
            { category: 'T', numbers: [131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210] },
        ]
    },
    {
        sectionName: "Intermediate/Primary",
        rows: [
            { category: 'K', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
            { category: 'K', numbers: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40] },
        ]
    }
];

// ======================================================
//      DATABASE SEEDER
// ======================================================
// We keep the seeder function here since it is tightly coupled to the configuration data.

// This function needs access to the Firestore `setDoc` and `collection` functions,

export async function seedDatabaseWithSections() {
    console.log("Starting to seed database FROM LAYOUT...");
    const seatsCollection = collection(db, "seats");

    // 1. Create flat lists of numbers for each category from your configuration
    const numberLists = {
        V: seatConfiguration.find(s => s.sectionName === "VIP/Sponsor").rows.flatMap(r => r.numbers),
        G: seatConfiguration.find(s => s.sectionName === "Ginto").rows.flatMap(r => r.numbers),
        P: seatConfiguration.find(s => s.sectionName === "Pilak").rows.flatMap(r => r.numbers),
        T: seatConfiguration.find(s => s.sectionName === "Tanso").rows.flatMap(r => r.numbers),
        K: seatConfiguration.find(s => s.sectionName === "Intermediate/Primary").rows.flatMap(r => r.numbers),
    };

    // 2. Create counters for each list
    const counters = { V: 0, G: 0, P: 0, T: 0, K: 0 };

    // 3. Iterate through the VISUAL LAYOUT, not the configuration
    for (const rowString of seatLayout) {
        for (const char of rowString) {
            if (char in seatTypes) { // It's a seat
                const type = seatTypes[char];
                const counter = counters[char];
                
                // Get the next number from the correct list
                const seatNum = numberLists[char][counter];
                if (seatNum === undefined) {
                    console.error(`Mismatch! Ran out of numbers for category ${char}. Check your configuration.`);
                    continue;
                }
                
                const seatId = `${char}${seatNum}`;
                const seatData = {
                    seatId: seatId,
                    category: type.category,
                    price: type.price,
                    status: type.status
                };

                try {
                    await setDoc(doc(seatsCollection, seatId), seatData);
                    console.log(`Successfully created document for ${seatId}`);
                } catch (error) {
                    console.error(`Error creating document for ${seatId}:`, error);
                }

                // Increment the counter for this specific category
                counters[char]++;
            }
        }
    }
    console.log("Database layout-driven seeding complete!");
}