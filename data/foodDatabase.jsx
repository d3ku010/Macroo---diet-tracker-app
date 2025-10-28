export const foodList = [
    // Indian Foods
    { name: 'Idli', calories: 58, protein: 2.0, carbs: 12.0, fat: 0.4, fiber: 0.8, sugar: 0.5, sodium: 2 },
    { name: 'Dosa', calories: 168, protein: 4.0, carbs: 22.0, fat: 7.4, fiber: 1.2, sugar: 1.0, sodium: 15 },
    { name: 'Appam', calories: 120, protein: 2.5, carbs: 24.0, fat: 2.0, fiber: 1.0, sugar: 2.0, sodium: 8 },
    { name: 'Chapati', calories: 104, protein: 3.1, carbs: 18.0, fat: 2.4, fiber: 2.8, sugar: 0.4, sodium: 181 },
    { name: 'Paratha', calories: 126, protein: 3.0, carbs: 18.0, fat: 4.4, fiber: 2.5, sugar: 0.6, sodium: 230 },
    { name: 'Naan', calories: 262, protein: 9.0, carbs: 45.0, fat: 5.1, fiber: 2.2, sugar: 3.5, sodium: 523 },

    // Rice & Grains
    { name: 'Basmati Rice (cooked)', calories: 130, protein: 2.7, carbs: 28.0, fat: 0.3, fiber: 0.4, sugar: 0.1, sodium: 1 },
    { name: 'Brown Rice (cooked)', calories: 112, protein: 2.6, carbs: 22.0, fat: 0.9, fiber: 1.8, sugar: 0.4, sodium: 5 },
    { name: 'Quinoa (cooked)', calories: 120, protein: 4.4, carbs: 22.0, fat: 1.9, fiber: 2.8, sugar: 0.9, sodium: 7 },
    { name: 'Oats', calories: 68, protein: 2.4, carbs: 12.0, fat: 1.4, fiber: 1.7, sugar: 0.3, sodium: 49 },

    // Proteins
    { name: 'Boiled Egg', calories: 155, protein: 13.0, carbs: 1.1, fat: 11.0, fiber: 0, sugar: 0.6, sodium: 124 },
    { name: 'Scrambled Egg', calories: 91, protein: 6.1, carbs: 0.7, fat: 6.7, fiber: 0, sugar: 0.4, sodium: 169 },
    { name: 'Chicken Breast (grilled)', calories: 165, protein: 31.0, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74 },
    { name: 'Fish (Salmon)', calories: 208, protein: 25.0, carbs: 0, fat: 12.0, fiber: 0, sugar: 0, sodium: 59 },
    { name: 'Paneer', calories: 321, protein: 25.0, carbs: 3.4, fat: 25.0, fiber: 0, sugar: 3.2, sodium: 18 },
    { name: 'Tofu', calories: 144, protein: 17.0, carbs: 2.8, fat: 9.0, fiber: 2.3, sugar: 0.6, sodium: 14 },

    // Legumes & Pulses
    { name: 'Dal (Cooked)', calories: 116, protein: 9.0, carbs: 20.0, fat: 0.4, fiber: 8.0, sugar: 2.0, sodium: 5 },
    { name: 'Chickpeas (cooked)', calories: 164, protein: 8.9, carbs: 27.0, fat: 2.6, fiber: 8.0, sugar: 4.8, sodium: 7 },
    { name: 'Black Beans (cooked)', calories: 132, protein: 8.9, carbs: 23.0, fat: 0.5, fiber: 8.7, sugar: 0.3, sodium: 2 },
    { name: 'Kidney Beans (cooked)', calories: 127, protein: 8.7, carbs: 23.0, fat: 0.5, fiber: 6.4, sugar: 0.3, sodium: 2 },

    // Vegetables
    { name: 'Potato (boiled)', calories: 77, protein: 2.0, carbs: 17.0, fat: 0.1, fiber: 2.2, sugar: 0.8, sodium: 6 },
    { name: 'Sweet Potato (boiled)', calories: 76, protein: 1.4, carbs: 17.0, fat: 0.1, fiber: 2.5, sugar: 5.4, sodium: 6 },
    { name: 'Broccoli', calories: 25, protein: 2.6, carbs: 5.0, fat: 0.4, fiber: 2.3, sugar: 1.5, sodium: 41 },
    { name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79 },
    { name: 'Carrot', calories: 41, protein: 0.9, carbs: 10.0, fat: 0.2, fiber: 2.8, sugar: 4.7, sodium: 69 },
    { name: 'Tomato', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, sodium: 5 },

    // Fruits
    { name: 'Apple', calories: 52, protein: 0.3, carbs: 14.0, fat: 0.2, fiber: 2.4, sugar: 10.0, sodium: 1 },
    { name: 'Banana', calories: 89, protein: 1.1, carbs: 23.0, fat: 0.3, fiber: 2.6, sugar: 12.0, sodium: 1 },
    { name: 'Orange', calories: 43, protein: 0.9, carbs: 11.0, fat: 0.1, fiber: 2.2, sugar: 8.5, sodium: 0 },
    { name: 'Mango', calories: 60, protein: 0.8, carbs: 15.0, fat: 0.4, fiber: 1.6, sugar: 13.0, sodium: 1 },
    { name: 'Grapes', calories: 62, protein: 0.6, carbs: 16.0, fat: 0.2, fiber: 0.9, sugar: 15.0, sodium: 2 },

    // Nuts & Seeds
    { name: 'Almonds', calories: 579, protein: 21.0, carbs: 22.0, fat: 50.0, fiber: 12.0, sugar: 4.4, sodium: 1 },
    { name: 'Walnuts', calories: 654, protein: 15.0, carbs: 14.0, fat: 65.0, fiber: 6.7, sugar: 2.6, sodium: 2 },
    { name: 'Peanuts', calories: 567, protein: 26.0, carbs: 16.0, fat: 49.0, fiber: 8.5, sugar: 4.7, sodium: 18 },
    { name: 'Cashews', calories: 553, protein: 18.0, carbs: 30.0, fat: 44.0, fiber: 3.3, sugar: 6.0, sodium: 12 },

    // Dairy
    { name: 'Milk (whole)', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sugar: 4.8, sodium: 44 },
    { name: 'Yogurt (plain)', calories: 59, protein: 10.0, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.2, sodium: 36 },
    { name: 'Cheese (cheddar)', calories: 402, protein: 25.0, carbs: 1.3, fat: 33.0, fiber: 0, sugar: 0.5, sodium: 653 },

    // Oils & Fats
    { name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fat: 100.0, fiber: 0, sugar: 0, sodium: 2 },
    { name: 'Coconut Oil', calories: 862, protein: 0, carbs: 0, fat: 100.0, fiber: 0, sugar: 0, sodium: 0 },
    { name: 'Ghee', calories: 900, protein: 0, carbs: 0, fat: 100.0, fiber: 0, sugar: 0, sodium: 0 },
    { name: 'Butter', calories: 717, protein: 0.9, carbs: 0.7, fat: 81.0, fiber: 0, sugar: 0.7, sodium: 643 }
];