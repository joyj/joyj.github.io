function triggerTranslation() {
    var ingredients = $('#ingredients-input').val();
    var translationKeys = getTranslationKeys();
    var linesOfIngredientInfo = getIngredients(ingredients);
    var display = constructDisplay(linesOfIngredientInfo, translationKeys);
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
    inputLines.forEach(function(line) {
        linesOfIngredientInfo.push(parseLineToInfo(line));
    });
    return linesOfIngredientInfo;
}

// Note: used for testing
function parseLineToInfo(line) {
    var tokens = line.split(/\s+/);  // any number of whitespace

    // find token that is a measurement, can have s at end
    // everything before is amt, after is ingredient
    var measure_amt = null;
    var measurement_unit = null;
    var ingredient = null;
    for (var i = 0; i < tokens.length && measure_amt == null; i++) {
        var token = tokens[i];

        // normalize token and check if we know about it
        // TODO measurement can be multiple tokens if fluid ounces
        var normalizedToken = token;
        if (normalizedToken[normalizedToken.length - 1] == "s") {
            normalizedToken = normalizedToken.substring(0, normalizedToken.length - 1);
        }
        var recognizedUnit = null;
        // handle the case when token matches but normalized doesn't.
        // E.g. when T is used for tablespoon
        if (normalizedToken in volume_conversions) {
            recognizedUnit = normalizedToken;
        } else {
            normalizedToken = normalizedToken.toLowerCase();
            if (normalizedToken in volume_conversions) {
                recognizedUnit = normalizedToken;
            }
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

function unpackIngredientInfo(ingrInfoObj) {
    if (ingrInfoObj == null) {
        return null;
    }
    var ingrInfo = ingrInfoObj["ingredient_info"];
    var amt = ingrInfoObj["measure_amt"];
    var unit = ingrInfoObj["unit"];
    var ingredient = ingrInfoObj["ingredientName"];
    var parsedIngredient = ingrInfoObj["parsedIngredientName"];
}

function tryToTranslateAmt(amtTokens) {
    if (amtTokens == null) {
        return null;
    }

    // translate amt to decimal
    var eval_amt = 0;
    amtTokens.forEach(function(num) {

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
    });
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
function translateIngredient(ingrInfoObj, translateTo) {
    if (ingrInfoObj == null) {
        return null;
    }
    var amt = ingrInfoObj["measure_amt"];
    var unit = ingrInfoObj["unit"];
    var ingredient = ingrInfoObj["ingredientName"];
    var parsedIngredient = ingrInfoObj["parsedIngredientName"];
    var original_line = ingrInfoObj["original_line"];
    var ingrInfo = ingrInfoObj["ingredient_info"];

    var mL = null;
    if (unit in volume_conversions) {
        mL = amt * volume_conversions[unit];
    }
    if (mL != null && ingrInfo != null) {
        if (translateTo == "ingredient") {
            return parsedIngredient;
        }
        if (translateTo == "grams") {
            var grams = round_decimal(mL * ingrInfo["grams"] / ingrInfo["mL"]);
            return grams + "g " + ingredient;
        }
        if (translateTo == "mL") {
            return round_decimal(mL) + "mL " + ingredient;
        }
        if (translateTo == "us_measures") {
            return "not implemented yet :(";
        }
        if (translateTo == "original_line") {
            return original_line;
        }
        if (translateTo == "parsed_info") {
            return getDebugMessage(ingrInfoObj);
        }
        if (translateTo == "hide_column") {
            return "";
        }
    }
    // Not able to translate
    if (translateTo == "ingredient") {
        return original_line;
    }
    if (translateTo == "original_line") {
        return "not translated";
    }
    return "";
}

function constructDisplay(ingredientInfoLines, translationKeys) {
    // TODO sanitize input before dumping into html
    var result = "";
    ingredientInfoLines.forEach(function(lineInfo) {
        var inputLine = lineInfo["original_line"];
        if (inputLine.match(/^\s*$/) == null) {
            // only generate table entry for non-empty input line
            var columns = "";
            translationKeys.forEach(function(key) {
                columns += '<td>' + translateIngredient(lineInfo, key) + '</td>'
            });
            result += '<tr class="generated">' + columns + '</tr>';
        }
    });
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
