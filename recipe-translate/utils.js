function triggerTranslation() {
    var ingredients = $('#ingredients-input').val();
    var multiplier = $('#multiplier-input').val();
    if (multiplier == null || multiplier == "") {
        multiplier = 1;
    }
    var translationKeys = getTranslationKeys();
    var linesOfIngredientInfo = getIngredients(ingredients);
    var display = constructDisplay(linesOfIngredientInfo, translationKeys, multiplier);
    $("#ingredients-table .generated").remove();
    $('#ingredients-table').append(display);
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
        if (!line.startsWith("###")) {
            linesOfIngredientInfo.push(parseLineToInfo(line));
        }
    }
    return linesOfIngredientInfo;
}

// Note: used for testing
function parseLineToInfo(line) {
    var editedLine = line;
    for (var i = 0; i < known_units.length; i++) {
        // add padding around all units
        var unit = known_units[i];
        editedLine = editedLine.replace(new RegExp("(\\d+)" + unit, 'gi'), "$1 " + unit + " ");
    }
    var tokens = editedLine.split(/\s+/);  // any number of whitespace

    // find token that is a measurement, can have s at end
    // everything before is amt, after is ingredient
    var measure_amt = null;
    var measurement_unit = null;
    var ingredient = null;
    for (var i = 0; i < tokens.length && measure_amt == null; i++) {
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
            normalizedToken = normalizedToken.substring(0, normalizedToken.length - 1);
        }
        if (normalizedToken2words[normalizedToken2words.length - 1] == "s") {
            normalizedToken2words = normalizedToken2words.substring(0, normalizedToken2words.length - 1);
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
            measure_amt = tokens.slice(0, i);
            measurement_unit = recognizedUnit;
            ingredient = tokens.slice(i + 1, tokens.length);
        }
    }

    // if able to parse line to amt + unit + ingredient, try to parse each part
    var closestIngr = null;
    var databaseIngredientName = null;
    var ingrInfo = null;
    if (ingredient) {
        closestIngr = tryToMatchIngredient(ingredient);
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
        "measure_amt": tryToTranslateAmt(measure_amt),
        "unit": measurement_unit,
        "parsedIngredientName": closestIngr,
        "ingredientName": databaseIngredientName,
        "ingredient_info": ingrInfo,
    };
}

function tryToMatchIngredient(ingredient_tokens) {
    // Remove any strange characters
    ingredient = ingredient_tokens.join(" ");
    ingredient_tokens = ingredient.split(/\W+/);

    // try to find a matching substring
    for (var start = 0; start < ingredient_tokens.length; start++) {
        for (var end = ingredient_tokens.length; end > start; end--) {
            ingredient = ingredient_tokens.slice(start, end).join(" ");
            normalizedIngredient = ingredient.toLowerCase();

            if (normalizedIngredient in known_ingredients) {
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
function getDebugMessage(ingrInfoObj) {
    if (ingrInfoObj == null) {
        return "Could not parse line into amt + unit + ingredient";
    }
    var amt = ingrInfoObj["measure_amt"];
    if (amt == null) {
        amt = "n/a";
    } else {
        amt = round_decimal(amt);
    }
    var unit = ingrInfoObj["unit"];
    if (unit == null) {
        unit = "n/a";
    }
    var ingredient = ingrInfoObj["ingredientName"];
    var parsedIngredient = ingrInfoObj["parsedIngredientName"];
    if (ingredient == null) {
        ingredient = "n/a";
    } else if (ingredient != parsedIngredient) {
        ingredient = parsedIngredient + " --> " + ingredient;
    }
    var ingrInfo = ingrInfoObj["ingredient_info"];
    return "amount: " + amt
        + " <br/> unit: " + unit
        + " <br/> ingredient: " + ingredient
        + " <br/> database ingredient entry: " + JSON.stringify(ingrInfo, null, 4);
}

// Note: used for testing
function translateIngredient(ingrInfoObj, translateTo, multiplier) {
    if (ingrInfoObj == null) {
        return null;
    }
    var amt = ingrInfoObj["measure_amt"];
    var unit = ingrInfoObj["unit"];
    var ingredient = ingrInfoObj["ingredientName"];
    var parsedIngredient = ingrInfoObj["parsedIngredientName"];
    var original_line = ingrInfoObj["original_line"];
    var ingrInfo = ingrInfoObj["ingredient_info"];

    if (translateTo == "hide_column") {
        return "";
    }
    if (translateTo == "parsed_info") {
        return getDebugMessage(ingrInfoObj);
    }
    if (translateTo == "original_line") {
        return original_line;
    }
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
    if (translateTo == "ingredient" && parsedIngredient != null) {
        return parsedIngredient;
    }
    if (translateTo == "grams" && grams != null) {
        return round_decimal(grams) + "g " + ingredient;
    }
    if (translateTo == "mL" && mL != null) {
        return round_decimal(mL) + "mL " + ingredient;
    }
    if (translateTo == "us_measures" && mL != null) {
        return calculateUsMeasure(mL) + " " + ingredient;
    }
    // Not able to translate
    if (translateTo == "ingredient") {
        return original_line;
    }
    return "";
}

function calculateUsMeasure(mL) {
    var smallest_measure = us_volume_lookup[0][1];
    var smallest_deno = us_volume_lookup[0][0];
    if (mL < smallest_deno) {
        var percent = round_decimal(mL / smallest_deno) * 100;
        return percent + "% of " + smallest_measure;
    }

    // round mL to a multiple of the smallest denomination
    var mL_remaining = Math.round(mL / smallest_deno) * smallest_deno;

    var to_return = "";
    if (mL_remaining >= 480) {
        var cupSize = 240;
        var numCups = Math.floor(mL_remaining / cupSize);
        mL_remaining = mL_remaining % cupSize;
        if (numCups > 1) {
            to_return += numCups + " cups";
        } else {
            to_return += "1 cup";
        }
    }
    for (var i = us_volume_lookup.length - 1; i >= 0; i--) {
        var curML = us_volume_lookup[i][0];
        var curMeasure = us_volume_lookup[i][1];
        if (curML <= mL_remaining) {
            if (to_return != "") {
                to_return += " + ";
            } 
            to_return += curMeasure;
            mL_remaining -= curML;
        }
    }
    return to_return;

}

function constructDisplay(ingredientInfoLines, translationKeys, multiplier) {
    // TODO sanitize input before dumping into html
    var result = "";
    for (var lineInfo of ingredientInfoLines) {
        var inputLine = lineInfo["original_line"];
        if (inputLine.match(/^\s*$/) == null && !inputLine.startsWith("###")) {
            // only generate table entry for non-empty input line
            var columns = "";
            for (var key of translationKeys) {
                columns += '<td>' + translateIngredient(lineInfo, key, multiplier) + '</td>'
            }
            result += '<tr class="generated">' + columns + '</tr>';
        }
    }
    return result;
}

function round_decimal(value) {
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

function getDropdownDisplay() {
    var choices = "";
    $.each(ingredientsColumnChoices, function(display, translateKey) {
        choices = choices
            + "<li><a href='#'>"
            + display
            + "</a></li>";
    });
    return choices;
}
