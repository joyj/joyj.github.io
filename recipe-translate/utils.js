function triggerTranslation() {
    // inputs
    var recipe = $('#recipe-input').val();
    var multiplier = $('#multiplier-input').val();
    var numServings = $('#servings-input').val();
    if (multiplier == null || multiplier == "") {
        multiplier = 1;
    }
    if (numServings == null || numServings == "") {
        numServings = 1;
    }

    // important calculations
    var ingredientInfoLines = getIngredients(recipe);
    var instructions = getInstructions(recipe);
    var ingredientAmts = ingredientInfoLines.map(
        function (ingredientLine) {
            return calculateAmts(ingredientLine, multiplier);
        });
    var ingredientTranslations = ingredientInfoLines.map(
        function (ingredientLine) {
            return getAllColumnTranslations(ingredientLine, multiplier);
        });

    // display ingredient translations
    var translationKeys = getTranslationKeys();
    var display = constructIngredientDisplay(
            ingredientTranslations, translationKeys);
    $("#ingredients-table .generated").remove();
    $('#ingredients-table').append(display);

    // display nutrition
    var nutrition = calculateNutrition(ingredientAmts, numServings);
    $('#nutritional-info').html(nutrition);

    // display instructions
    var instructionDisplay = constructInstructionDisplay(
            instructions, ingredientTranslations, translationKeys);
    $("#instructions .generated").remove();
    $('#instructions').append(instructionDisplay);
    $('[data-toggle="tooltip"]').tooltip()
};

function getTranslationKeys() {
    var numHeaders = $("#ingredients-table-headers").children().length;
    var translationKeys = [];
    for (var i = 0; i < numHeaders; i++) {
        var headerId = "#dLabel" + i;
        var headerContents = $(headerId).text().trim();
        if (headerContents in ingredientsColumnChoices) {
            translationKeys.push(ingredientsColumnChoices[headerContents]);
        } else {
            translationKeys.push(null);
        }
    }
    return translationKeys;
}


// Functions under here don't depend on the page state


function getIngredients(input) {
    var inputLines = input.split("\n");
    var linesOfIngredientInfo = [];
    for (var line of inputLines) {
        if (line.startsWith("===")) {
            break;
        }
        if (line.match(/^\s*$/) == null && !line.startsWith("###")) {
            linesOfIngredientInfo.push(parseLineToInfo(line));
        }
    }
    return linesOfIngredientInfo;
}

function getInstructions(input) {
    var inputLines = input.split("\n");
    var instructionsLines = [];
    var reachedInstructions = false;
    for (var line of inputLines) {
        if (line.startsWith("===")) {
            reachedInstructions = true;
        } else {
            if (reachedInstructions
                    && line.match(/^\s*$/) == null
                    && !line.startsWith("###")) {
                instructionsLines.push(line);
            }
        }
    }
    return instructionsLines;
}

// Note: used for testing
function parseLineToInfo(line) {
    var editedLine = line;
    for (var i = 0; i < known_units.length; i++) {
        // add padding around all units
        var unit = known_units[i];
        editedLine = editedLine.replace(
            new RegExp("(\\d+)" + unit, 'gi'),
            "$1 " + unit + " ");
    }
    var tokens = editedLine.split(/\s+/);  // any number of whitespace

    // find token that is a measurement, can have s at end
    // everything before is amt, after is ingredient
    var measureAmt = null;
    var measurementUnit = null;
    var ingredient = null;
    for (var i = 0; i < tokens.length && measureAmt == null; i++) {
        var token = tokens[i];
        var tokenOf2words = "";
        if (i + 1 < tokens.length) {
            var tokenOf2words = token + " " + tokens[i + 1];
        }

        // normalize token and check if we know about it
        // TODO measurement can be multiple tokens if fluid ounces
        var normalizedToken = token;
        var normalizedToken2words = tokenOf2words;
        if (normalizedToken[normalizedToken.length - 1] == "s") {
            normalizedToken = normalizedToken.substring(
                    0, normalizedToken.length - 1);
        }
        if (normalizedToken2words[normalizedToken2words.length - 1] == "s") {
            normalizedToken2words = normalizedToken2words.substring(
                    0, normalizedToken2words.length - 1);
        }
        var recognizedUnit = null;
        // handle the case when token matches but normalized doesn't.
        // E.g. when T is used for tablespoon
        if (known_units.includes(normalizedToken)) {
            recognizedUnit = normalizedToken;
        } else if (known_units.includes(normalizedToken2words)) {
            recognizedUnit = normalizedToken2words;
        } else if (known_units.includes(normalizedToken.toLowerCase())) {
            recognizedUnit = normalizedToken.toLowerCase();
        } else if (known_units.includes(normalizedToken2words.toLowerCase())) {
            recognizedUnit = normalizedToken2words.toLowerCase();
        }
        if (recognizedUnit != null) {
            measureAmt = tokens.slice(0, i);
            measurementUnit = recognizedUnit;
            ingredient = tokens.slice(i + 1, tokens.length).join(" ");
        }
    }

    // if able to parse line to amt + unit + ingredient, try to parse each part
    var closestIngr = null;
    var databaseIngredientName = null;
    var ingrInfo = null;
    if (ingredient) {
        closestIngr = tryToMatchIngredient(ingredient, known_ingredients);
        databaseIngredientName = closestIngr;
        if (closestIngr != null) {
            ingrInfo = known_ingredients[closestIngr];
            if ("aka" in ingrInfo) {
                databaseIngredientName = ingrInfo["aka"];
                if (databaseIngredientName in known_ingredients) {
                    // TODO trigger error if not in known_ingredients
                    ingrInfo = known_ingredients[databaseIngredientName];
                }
            }
        }
    }
    return {
        "original_line": line,
        "measure_amt": tryToTranslateAmt(measureAmt),
        "unit": measurementUnit,
        "parsed_everything_after_unit": ingredient,
        "parsed_ingredient_name": closestIngr,
        "ingredient_name": databaseIngredientName,
        "ingredient_info": ingrInfo,
    };
}

function generateIngredientNicknames(ingredient) {
    if (ingredient == null || ingredient == undefined) {
        return [];
    }
    var ingredientTokens = ingredient.split(/\W+/);
    var ingredientSubstrings = [];
    for (var start = 0; start < ingredientTokens.length; start++) {
            var ingredient = ingredientTokens
                .slice(start, ingredientTokens.length)
                .join(" ");
            ingredientSubstrings.push(ingredient);
    }
    return ingredientSubstrings;
}

function tryToMatchIngredient(ingredient, ingredients_database) {
    // Remove any strange characters
    ingredientTokens = ingredient.split(/\W+/);

    // try to find a matching substring
    for (var start = 0; start < ingredientTokens.length; start++) {
        for (var end = ingredientTokens.length; end > start; end--) {
            ingredient = ingredientTokens.slice(start, end).join(" ");
            normalizedIngredient = ingredient.toLowerCase();

            if (normalizedIngredient in ingredients_database) {
                return normalizedIngredient;
            }
        }
    }
    return null;
}

function tryToTranslateAmt(amtTokens) {
    if (amtTokens == null) {
        return null;
    }

    // translate amt to decimal
    var eval_amt = 0;
    for (var num of amtTokens) {

        $.each(fractions_conversion, function(frac_char, replacement) {
            num = num.replace(frac_char, replacement);
        });
        num = num.replace(" ", "+");
        try {
            num = eval(num);
            eval_amt = eval_amt + num;
        } catch(err) {
            // do nothing for now
        }
    }
    return eval_amt;
}

// Note: used for testing
function getDebugMessage(ingredientLineObj) {
    if (ingredientLineObj == null) {
        return "Could not parse line into amt + unit + ingredient";
    }
    var amt = ingredientLineObj["measure_amt"];
    if (amt == null) {
        amt = "n/a";
    } else {
        amt = roundDecimal(amt);
    }
    var unit = ingredientLineObj["unit"];
    if (unit == null) {
        unit = "n/a";
    }
    var ingredient = ingredientLineObj["ingredient_name"];
    var parsedIngredient = ingredientLineObj["parsed_ingredient_name"];
    if (ingredient == null) {
        ingredient = "n/a";
    } else if (ingredient != parsedIngredient) {
        ingredient = parsedIngredient + " --> " + ingredient;
    }
    var ingrInfo = ingredientLineObj["ingredient_info"];
    return "amount: " + amt
        + " <br/> unit: " + unit
        + " <br/> ingredient: " + ingredient
        + " <br/> database ingredient entry: "
            + JSON.stringify(ingrInfo, null, 4);
}

// Note: used for testing
function calculateAmts(ingredientLineObj, multiplier) {
    if (ingredientLineObj == null) {
        return null;
    }
    var amt = ingredientLineObj["measure_amt"];
    var unit = ingredientLineObj["unit"];
    var ingrInfo = ingredientLineObj["ingredient_info"];

    var mL = null;
    var grams = null;
    if (unit in volume_conversions) {
        mL = amt * volume_conversions[unit] * eval(multiplier);
        if (ingrInfo != null) {
            grams = mL * ingrInfo["grams"] / ingrInfo["mL"];
        }
    }
    if (unit in mass_conversions) {
        grams = amt * mass_conversions[unit] * eval(multiplier);
        if (ingrInfo != null) {
            mL = grams * ingrInfo["mL"] / ingrInfo["grams"];
        }
    }
    var amtObj = {
        "calories": 0,
        "fat": 0,
        "carbohydrates": 0,
        "protein": 0,
    };
    if (grams != null) {
        amtObj["grams"] = grams;
    }
    if (mL != null) {
        amtObj["mL"] = mL;
    }
    if (grams != null && ingrInfo != null) {
        amtObj["calories"] = grams * ingrInfo["calories"] / ingrInfo["grams"];
        amtObj["fat"] = grams * ingrInfo["fat"] / ingrInfo["grams"];
        amtObj["carbohydrates"] = (
                grams * ingrInfo["carbohydrates"] / ingrInfo["grams"]);
        amtObj["protein"] = grams * ingrInfo["protein"] / ingrInfo["grams"];
    }
    return amtObj;
}

// Note: used for testing
function getAllColumnTranslations(ingredientLineObj, multiplier) {
    if (ingredientLineObj == null) {
        return null;
    }
    var translations = {};

    var ingredientAfterUnit = ingredientLineObj["parsed_everything_after_unit"];
    var parsedIngredient = ingredientLineObj["parsed_ingredient_name"];
    var originalLine = ingredientLineObj["original_line"];

    translations["hide_column"] = "";
    translations["parsed_info"] = getDebugMessage(ingredientLineObj);
    translations["original_line"] = originalLine;
    if (parsedIngredient != null) {
        translations["ingredient"] = parsedIngredient;
    } else {
        translations["ingredient"] = originalLine;
    }

    var ingredient = ingredientLineObj["ingredient_name"];
    if (ingredient == null) {
        ingredient = ingredientAfterUnit;
    }
    var amts = calculateAmts(ingredientLineObj, multiplier);
    var mL = amts["mL"];
    var grams = amts["grams"];
    if (grams != null) {
        translations["grams"] = roundDecimal(grams) + "g " + ingredient;
    } else {
        translations["grams"] = "";
    }
    if (mL != null) {
        translations["mL"] = roundDecimal(mL) + "mL " + ingredient;
        translations["us_measures"] = calculateUsMeasure(mL) + " " + ingredient;
    } else {
        translations["mL"] = "";
        translations["us_measures"] = "";
    }
    return translations;
}

function calculateUsMeasure(mL) {
    var smallestMeasure = us_volume_lookup[0][1];
    var smallestDeno = us_volume_lookup[0][0];
    if (mL < smallestDeno) {
        var percent = roundDecimal(mL / smallestDeno) * 100;
        return percent + "% of " + smallestMeasure;
    }

    // round mL to a multiple of the smallest denomination
    var mlRemaining = Math.round(mL / smallestDeno) * smallestDeno;

    var toReturn = "";
    if (mlRemaining >= 480) {
        var cupSize = 240;
        var numCups = Math.floor(mlRemaining / cupSize);
        mlRemaining = mlRemaining % cupSize;
        if (numCups > 1) {
            toReturn += numCups + " cups";
        } else {
            toReturn += "1 cup";
        }
    }
    for (var i = us_volume_lookup.length - 1; i >= 0; i--) {
        var curML = us_volume_lookup[i][0];
        var curMeasure = us_volume_lookup[i][1];
        if (curML <= mlRemaining) {
            if (toReturn != "") {
                toReturn += " + ";
            } 
            toReturn += curMeasure;
            mlRemaining -= curML;
        }
    }
    return toReturn;
}

function constructIngredientDisplay(ingTranslations, translationKeys) {
    // TODO sanitize input before dumping into html
    var result = "";
    for (var ingredient of ingTranslations) {
        var columns = "";
        for (var key of translationKeys) {
            columns += '<td>' + ingredient[key] + '</td>'
        }
        result += '<tr class="ingredients-details generated">' + columns
            + '</tr>';
    }
    return result;
}

// Note: used in tests
function constructInstructionDisplay(
        instructions, ingTranslations, translationKeys) {
    // TODO sanitize input before dumping into html
    var result = '<ol class="instructions-list generated">';
    var remainingIngredients = ingTranslations;
    for (var line of instructions) {
        var unusedIngredients = [];
        for (var ingredient of remainingIngredients) {
            var ingredientName = ingredient["ingredient"];
            var ingredientNicknames = generateIngredientNicknames(
                    ingredientName);
            var matchedIngredient = false;

            for (var nickname of ingredientNicknames) {
                if (line.match(nickname) != null) {
                    matchedIngredient = true;
                    var tooltipText = "";
                    for (var translateKey of translationKeys) {
                        if (Object.values(hoverChoices)
                                .includes(translateKey)) {
                            if (tooltipText != "") {
                                tooltipText += " | ";
                            }
                            tooltipText += ingredient[translateKey];
                        }
                    }
                    var hoverText = '<span'
                            + ' class="tooltip-element"'
                            + ' data-toggle="tooltip"'
                            + ' data-placement="top"'
                            + ' title="' + tooltipText + '">'
                        + nickname
                        + '</span>';
                    line = line.replace(new RegExp(nickname, 'gi'), hoverText);
                    break;
                }
            } 
            if (!matchedIngredient){
                unusedIngredients.push(ingredient);
            }
        }
        result += '<li class="instruction-line generated">' + line + '</li>';
        remainingIngredients = unusedIngredients;
    }
    return result + "</ol>";
}

// Notes: used for testing
function calculateNutrition(allIngredientAmts, numServings) {
    var nutrition = {
        "calories": 0,
        "fat": 0,
        "carbohydrates": 0,
        "protein": 0,
    };
    for (var ingredientAmts of allIngredientAmts) {
        $.each(nutrition, function(key, _) {
            nutrition[key] += ingredientAmts[key];
        });
    }
    $.each(nutrition, function(key, _) {
        try {
            nutrition[key] /= eval(numServings);
        } catch(err) {
            // do nothing for now (so 1 serving)
            // TODO maybe a message that says this is the error
        }
    });
    return formatNutrition(
        roundDecimal(nutrition["calories"]),
        roundDecimal(nutrition["fat"]),
        roundDecimal(nutrition["carbohydrates"]),
        roundDecimal(nutrition["protein"]));
}

// Note: used in testing
function formatNutrition(calories, fat, carbs, protein) {
    return "Nutrition per serving"
        + " | calories: " + calories
        + " | fat: " + fat + "g"
        + " | carbohydrates: " + carbs + "g"
        + " | protein: " + protein + "g";
}

function roundDecimal(value) {
    var decimals = 2;  // round to 2 places after decimal point
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

var ingredientsColumnChoices = {
    "Ingredient": "ingredient",
    "Mass (grams)": "grams",
    "Volume (mL)": "mL",
    "Volume (US measures)": "us_measures",
    "Original Line": "original_line",
    "Parsed Info": "parsed_info",
    "Choose one": "hide_column",
};

var hoverChoices = {
    "Mass (grams)": "grams",
    "Volume (mL)": "mL",
    "Volume (US measures)": "us_measures",
    "Original Line": "original_line",
};

function getDropdownDisplay() {
    var choices = "";
    $.each(ingredientsColumnChoices, function(display, translateKey) {
        choices = choices
            + "<li><a href='#' data-toggle='dropdown'>"
            + display
            + "</a></li>";
    });
    return choices;
}
