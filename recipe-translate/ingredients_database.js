var volume_conversions = {
    // US measure to mL
    "ml": 1,
    "mL": 1,
    "teaspoon": 5,
    "tsp": 5,
    "t": 5,
    "tablespoon": 15,
    "tbsp": 15,
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
        "protein": 13,
        "carbohydrates": 95,
        "fat": 1.2,
    },
    "flour" : {
        "aka": "all purpose flour",
    },
    "sugar" : {
        "grams": 200,
        "mL": 240,
        "calories": 773,
        "fat": 0,
        "carbohydrates": 200,
        "protein": 0,
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
    "butter" : {
        "grams": 14.2,
        "mL": 15,
        "calories": 102,
        "fat": 12,
        "carbohydrates": 0,
        "protein": 0.1,
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
    "honey" : {
        "grams": 21,
        "mL": 15,
        "calories": 64,
        "fat": 0,
        "carbohydrates": 17,
        "protein": 0.1,
    },
    "apple cider vinegar" : {
        "grams": 14.9,
        "mL": 15,
        "calories": 3,
        "fat": 0,
        "carbohydrates": 0.1,
        "protein": 0,
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
    "template" : {
        "grams": 0,
        "mL": 0,
        "calories": 0,
        "fat": 0,
        "carbohydrates": 0,
        "protein": 0,
    },
}
