var volume_conversions = {
    // US measure to mL
    "ml": 1,
    "mL": 1,
    "teaspoon": 5,
    "tsp": 5,
    "tsp.": 5,
    "t": 5,
    "tablespoon": 15,
    "tbsp": 15,
    "tbsp.": 15,
    "T": 15,
    "fl oz" : 30,
    "fl. oz." : 30,
    "fluid ounce" : 30,
    "cup" : 240,
};

var mass_conversions = {
    // to g
    "g": 1,
    "gram": 1,
    "oz" : 28.35,
    "ounce" : 28.35,
    "lb": 453.6,
    "pound": 453.6,
};

var us_volume_lookup = [
    // mL to US measures
    [0.625, "1/8 tsp"],
    [1.25, "1/4 tsp"],
    [1.875, "3/8 tsp"],
    [2.5, "1/2 tsp"],
    [3.75, "3/4 tsp"],
    [5, "1 tsp"],
    [7.5, "1/2 tbsp"],
    [10, "2 tsp"],
    [15, "1 tbsp"],
    [20, "4 tsp"],
    [30, "2 tbsp"],
    [45, "3 tbsp"],
    [60, "1/4 cup"],
    [75, "5 tbsp"],
    [80, "1/3 cup"],
    [90, "6 tbsp"],
    [115, "7 tbsp"],
    [120, "1/2 cup"],
    [160, "2/3 cup"],
    [180, "3/4 cup"],
    [240, "1 cup"],
    [300, "1 1/4 cup"],
    [320, "1 1/3 cup"],
    [360, "1 1/2 cup"],
    [400, "1 2/3 cup"],
];

var known_units = [].concat(
    Object.keys(volume_conversions),
    Object.keys(mass_conversions));

var fractions_conversion = {
    "\u00BC": " 1/4",
    "\u00BD": " 1/2",
    "\u00BE": " 3/4",
    "\u2150": " 1/7",
    "\u2151": " 1/9",
    "\u2152": " 1/10",
    "\u2153": " 1/3",
    "\u2154": " 2/3",
    "\u2155": " 1/5",
    "\u2156": " 2/5",
    "\u2157": " 3/5",
    "\u2158": " 4/5",
    "\u2159": " 1/6",
    "\u215A": " 5/6",
    "\u215B": " 1/8",
    "\u215C": " 3/8",
    "\u215D": " 5/8",
    "\u215E": " 7/8"
};

var stop_words = [
    "organic",
];

var known_ingredients = {
    "water" : {
        // density
        "grams": 1,
        "mL": 1,
        // macros are always number of grams out of total grams listed above
        "calories": 0,
        "protein": 0,
        "carbohydrates": 0,
        "fat": 0,
    },
    "all purpose flour" : {
        "grams": 125,
        "mL": 240,
        "calories": 455,
        "fat": 1.2,
        "carbohydrates": 95,
        "protein": 13,
    },
    "flour" : {
        "aka": "all purpose flour",
    },
    "oat flour" : {
        "grams": 30,
        "mL": 60,
        "calories": 120,
        "fat": 2,
        "carbohydrates": 22,
        "protein": 3,
    },
    "coconut flour" : {
        "grams": 14,
        "mL": 30,
        "calories": 60,
        "fat": 1.5,
        "carbohydrates": 9,
        "protein": 3,
    },
    "almond flour" : {
        "grams": 14,
        "mL": 30,
        "calories": 80,
        "fat": 5,
        "carbohydrates": 5,
        "protein": 4,
    },
    "chickpea flour": {
        "grams": 30,
        "mL": 60,
        "calories": 110,
        "fat": 2,
        "carbohydrates": 18,
        "protein": 6
    },
    "garbanzo bean flour" : {
        "aka": "chickpea flour",
    },
    "masa harina": {
        "grams": 29,
        "mL": 60,
        "calories": 100,
        "fat": 1,
        "carbohydrates": 21,
        "protein": 2
    },
    "corn kernels": {
        "grams": 90,
        "mL": 160,
        "calories": 80,
        "fat": 0.5,
        "carbohydrates": 19,
        "protein": 3
    },
    "cornmeal": {
        "grams": 27,
        "mL": 45,
        "calories": 90,
        "fat": 0.5,
        "carbohydrates": 21,
        "protein": 2
    },
    "corn meal" : {
        "aka": "cornmeal",
    },
    "sugar" : {
        "grams": 200,
        "mL": 240,
        "calories": 773,
        "fat": 0,
        "carbohydrates": 200,
        "protein": 0,
    },
    "granulated sweetener" : {
        "aka": "sugar",
    },
    "sweetener" : {
        "aka": "sugar",
    },
    "packed brown sugar" : {
        "grams": 220,
        "mL": 240,
        "calories": 836,
        "fat": 0,
        "carbohydrates": 216,
        "protein": 0.3,
    },
    "brown sugar" : {
        "aka": "packed brown sugar",
    },
    "powdered sugar" : {
        "grams": 8,
        "mL": 15,
        "calories": 31,
        "fat": 0,
        "carbohydrates": 8,
        "protein": 0,
    },
    "powdered sweetener" : {
        "aka": "powdered sugar",
    },
    "butter" : {
        "grams": 14.2,
        "mL": 15,
        "calories": 102,
        "fat": 12,
        "carbohydrates": 0,
        "protein": 0.1,
    },
    "peanut butter" : {
        "grams": 32,
        "mL": 30,
        "calories": 190,
        "fat": 16,
        "carbohydrates": 6,
        "protein": 8,
    },
    "nut butter" : {
        "aka": "peanut butter",
    },
    "almond butter" : {
        "aka": "peanut butter",
    },
    "cashew butter" : {
        "aka": "peanut butter",
    },
    "table salt" : {
        "grams": 18,
        "mL": 15,
        "calories": 0,
        "protein": 0,
        "carbohydrates": 0,
        "fat": 0,
    },
    "salt" : {
        "aka": "table salt",
    },
    "coarse sea salt" : {
        "grams": 1.4,
        "mL": 5/4,
        "calories": 0,
        "protein": 0,
        "carbohydrates": 0,
        "fat": 0,
    },
    "sea salt" : {
        "aka": "coarse sea salt",
    },
    "kosher salt" : {
        "aka": "coarse sea salt",
    },
    "vegetable oil" : {
        "grams": 14,
        "mL": 15,
        "calories": 124,
        "protein": 0,
        "carbohydrates": 0,
        "fat": 14,
    },
    "oil" : {
        "aka": "vegetable oil",
    },
    "coconut oil" : {
        "aka": "vegetable oil",
    },
    "unsweetened soy milk" : {
        "grams": 243,
        "mL": 240,
        "calories": 80,
        "fat": 4,
        "carbohydrates": 4,
        "protein": 8,
    },
    "soy milk" : {
        "aka": "unsweetened soy milk",
    },
    "dairy free milk" : {
        "aka": "unsweetened soy milk",
    },
    "coconut milk" : {
        "grams": 240,
        "mL": 240,
        "calories": 552,
        "fat": 57,
        "carbohydrates": 13,
        "protein": 5,
    },
    "unsweetened almond milk" : {
        "grams": 240,
        "mL": 240,
        "calories": 30,
        "fat": 2.5,
        "carbohydrates": 1,
        "protein": 1,
    },
    "almond milk" : {
        "aka": "unsweetened almond milk",
    },
    "nonfat milk" : {
        "grams": 245,
        "mL": 240,
        "calories": 83,
        "fat": 0.2,
        "carbohydrates": 12,
        "protein": 8,
    },
    "skim milk" : {
        "aka": "nonfat milk",
    },
    "2% milk" : {
        "grams": 246,
        "mL": 240,
        "calories": 124,
        "fat": 4.9,
        "carbohydrates": 12,
        "protein": 8,
    },
    "milk" : {
        "aka": "2% milk",
    },
    "coconut cream" : {
        "grams": 15,
        "mL": 15,
        "calories": 49,
        "fat": 5,
        "carbohydrates": 1,
        "protein": 0.5,
    },
    "baking powder" : {
        "grams": 4.6,
        "mL": 5,
        "calories": 2,
        "fat": 0,
        "carbohydrates": 1.3,
        "protein": 0,
    },
    "baking soda" : {
        "grams": 4.6,
        "mL": 5,
        "calories": 0,
        "fat": 0,
        "carbohydrates": 0,
        "protein": 0,
    },
    "vanilla extract" : {
        "grams": 13,
        "mL": 15,
        "calories": 38,
        "fat": 0,
        "carbohydrates": 1.6,
        "protein": 0,
    },
    "dried cranberries" : {
        "grams": 40,
        "mL": 240 / 3,
        "calories": 123,
        "fat": 0.5,
        "carbohydrates": 33,
        "protein": 0,
    },
    "cocoa powder" : {
        "grams": 5.4,
        "mL": 15,
        "calories": 12,
        "fat": 0.7,
        "carbohydrates": 3.1,
        "protein": 1.1,
    },
    "cocoa" : {
        "aka": "cocoa powder",
    },
    "maple syrup" : {
        "grams": 20,
        "mL": 15,
        "calories": 52,
        "fat": 0,
        "carbohydrates": 13,
        "protein": 0,
    },
    "agave syrup" : {
        "grams": 6.9,
        "mL": 5,
        "calories": 21,
        "fat": 0,
        "carbohydrates": 5,
        "protein": 0,
    },
    "agave" : {
        "aka": "agave syrup",
    },
    "liquid sweetener" : {
        "aka": "agave syrup",
    },
    "honey" : {
        "grams": 21,
        "mL": 15,
        "calories": 64,
        "fat": 0,
        "carbohydrates": 17,
        "protein": 0.1,
    },
    "cornstarch" : {
        "grams": 128,
        "mL": 240,
        "calories": 488,
        "fat": 0.1,
        "carbohydrates": 117,
        "protein": 0.3,
    },
    "corn starch" : {
        "aka": "cornstarch",
    },
    "tapioca starch" : {
        "grams": 30,
        "mL": 60,
        "calories": 100,
        "fat": 0,
        "carbohydrates": 26,
        "protein": 0,
    },
    "tapioca flour" : {
        "aka": "tapioca starch",
    },
    "potato starch" : {
        "grams": 160,
        "mL": 240,
        "calories": 571,
        "fat": 0.5,
        "carbohydrates": 133,
        "protein": 11,
    },
    "arrowroot starch" : {
        "grams": 32,
        "mL": 60,
        "calories": 110,
        "fat": 0,
        "carbohydrates": 128,
        "protein": 0,
    },
    "arrowroot powder" : {
        "aka": "arrowroot starch",
    },
    "arrowroot flour" : {
        "aka": "arrowroot starch",
    },
    "nutritional yeast": {
        "grams": 5,
        "mL": 15,
        "calories": 20,
        "fat": 0,
        "carbohydrates": 2,
        "protein": 3
    },
    "apple cider vinegar" : {
        "grams": 14.9,
        "mL": 15,
        "calories": 3,
        "fat": 0,
        "carbohydrates": 0.1,
        "protein": 0,
    },
    "vinegar" : {
        "aka": "apple cider vinegar",
    },
    "dry rolled oats" : {
        "grams": 40,
        "mL": 125,
        "calories": 150,
        "fat": 3,
        "carbohydrates": 27,
        "protein": 5,
    },
    "oats" : {
        "aka": "dry rolled oats",
    },
    "black beans" : {
        "grams": 184,
        "mL": 240,
        "calories": 624,
        "fat": 1.7,
        "carbohydrates": 116,
        "protein": 39,
    },
    "chocolate chips" : {
        "grams": 15,
        "mL": 15,
        "calories": 80,
        "fat": 4,
        "carbohydrates": 10,
        "protein": 1,
    },
    "unsweetened applesauce" : {
        "grams": 246,
        "mL": 240,
        "calories": 166,
        "fat": 0.4,
        "carbohydrates": 43,
        "protein": 0.4,
    },
    "applesauce" : {
        "aka": "unsweetened applesauce",
    },
    "apple sauce" : {
        "aka": "unsweetened applesauce",
    },
    "popping corn" : {
        "grams": 36,
        "mL": 45,
        "calories": 130,
        "fat": 1.5,
        "carbohydrates": 26,
        "protein": 4,
    },
    "popcorn" : {
        "aka": "popping corn",
    },
    "sesame seeds" : {
        "grams": 9,
        "mL": 15,
        "calories": 52,
        "fat": 4.5,
        "carbohydrates": 2.1,
        "protein": 1.6,
    },
    "chia seeds" : {
        "grams": 28.4,
        "mL": 30,
        "calories": 138,
        "fat": 9,
        "carbohydrates": 12,
        "protein": 4.7,
    },
    "flax seeds" : {
        "grams": 10.3,
        "mL": 15,
        "calories": 55,
        "fat": 4.3,
        "carbohydrates": 3,
        "protein": 1.9,
    },
    "flaxseed" : {
        "aka": "flax seeds",
    },
    "ground flax seeds" : {
        "grams": 7,
        "mL": 15,
        "calories": 37,
        "fat": 3,
        "carbohydrates": 2,
        "protein": 1.3,
    },
    "ground flaxseed" : {
        "aka": "ground flax seeds",
    },
    "ground flax" : {
        "aka": "ground flax seeds",
    },
    "hemp seeds" : {
        "grams": 30,
        "mL": 45,
        "calories": 166,
        "fat": 15,
        "carbohydrates": 2.6,
        "protein": 9.5,
    },
    "pumpkin seeds" : {
        "grams": 64,
        "mL": 240,
        "calories": 285,
        "fat": 12,
        "carbohydrates": 34,
        "protein": 12,
    },
    "peanuts" : {
        "grams": 146,
        "mL": 240,
        "calories": 828,
        "fat": 72,
        "carbohydrates": 24,
        "protein": 38,
    },
    "cashews" : {
        "grams": 30,
        "mL": 60,
        "calories": 170,
        "fat": 13,
        "carbohydrates": 9,
        "protein": 5,
    },
    "pistachios" : {
        "grams": 123,
        "mL": 240,
        "calories": 671,
        "fat": 56,
        "carbohydrates": 34,
        "protein": 25,
    },
    "pecans" : {
        "grams": 100,
        "mL": 240,
        "calories": 654,
        "fat": 65,
        "carbohydrates": 14,
        "protein": 15,
    },
    "walnuts" : {
        "grams": 80,
        "mL": 240,
        "calories": 684,
        "fat": 71,
        "carbohydrates": 14,
        "protein": 9,
    },
    "Medjool dates" : {
        "grams": 7.1,
        "mL": 12,
        "calories": 20,
        "fat": 0,
        "carbohydrates": 5,
        "protein": 0.2,
    },
    "medjool dates" : {
        "aka": "Medjool dates",
    },
    "dates" : {
        "aka": "Medjool dates",
    },
    "cinnamon" : {
        "grams": 7.8,
        "mL": 15,
        "calories": 19,
        "fat": 0.1,
        "carbohydrates": 6,
        "protein": 0.3,
    },
    "nutmeg" : {
        "grams": 7,
        "mL": 15,
        "calories": 37,
        "fat": 2.5,
        "carbohydrates": 3.5,
        "protein": 0.4,
    },
    "agar agar" : {
        "grams": 10,
        "mL": 30,
        "calories": 3,
        "fat": 0,
        "carbohydrates": 0.7,
        "protein": 0.1,
    },
    "aquafaba" : {
        "grams": 15,
        "mL": 15,
        "calories": 4,
        "fat": 0,
        "carbohydrates": 0,
        "protein": 0,
    },
    "mrm veggie elite protein powder" : {
        "grams": 34,
        "mL": 70,
        "calories": 130,
        "fat": 1.5,
        "carbohydrates": 5,
        "protein": 24,
    },
    "protein powder" : {
        "aka": "mrm veggie elite protein powder",
    },
    "template" : {
        "grams": 0,
        "mL": 0,
        "calories": 0,
        "fat": 0,
        "carbohydrates": 0,
        "protein": 0,
    },
}
