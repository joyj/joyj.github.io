function triggerTranslation() {
    var ingredients = $('#ingredients-input').val();
    translateAndDisplayIngredients(ingredients);
};

function translateAndDisplayIngredients(input) {
    var inputLines = input.split("\n");
    var linesOfIngredientInfo = [];
    inputLines.forEach(function(line) {
        linesOfIngredientInfo.push(parseLineToLineInfo(line));
    });
    var display = constructDisplay(linesOfIngredientInfo);
    $("#ingredients-table .generated").remove();
    $('#ingredients-table').append(display);
}

function parseLineToLineInfo(line) {
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
        var normalizedToken = token.toLowerCase();
        if (normalizedToken[normalizedToken.length - 1] == "s") {
            normalizedToken = normalizedToken.substring(0, normalizedToken.length - 1);
        }
        if (normalizedToken in volume_conversions) {
            token = normalizedToken;
        }
        // handle the case when token matches but normalized doesn't.
        // E.g. when T is used for tablespoon
        if (token in volume_conversions) {
            measure_amt = tokens.slice(0, i);
            measurement_unit = normalizedToken;
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
                ingrInfo = known_ingredients[databaseIngredientName];
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
            if (ingredient in known_ingredients) {
                return ingredient;
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
    return "amount: " + amt
        + " <br/> unit: " + unit
        + " <br/> ingredient: " + ingredient;
}

function translateIngredient(translateTo) {
    function translate(ingrInfoObj) {
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
        if (mL != null) {
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
    return translate;
}

function getColumnFunctions() {
    var numHeaders = $("#ingredients-table-headers").children().length;
    var headerFuncs = [];
    for (var i = 0; i < numHeaders; i++) {
        var headerId = "#dLabel" + i;
        var headerContents = $(headerId).text().trim();
        if (headerContents in ingredientsColumnChoices) {
            headerFuncs.push(ingredientsColumnChoices[headerContents]);
        } else {
            headerFuncs.push(function() {return "";});
        }
    }
    return headerFuncs;
}

function constructDisplay(ingredientInfoLines) {
    // TODO sanitize input before dumping into html
    var columnFunctions = getColumnFunctions();
    var result = "";
    ingredientInfoLines.forEach(function(lineInfo) {
        var inputLine = lineInfo["original_line"];
        if (inputLine.match(/^\s*$/) == null) {
            // only generate table entry for non-empty input line
            var columns = "";
            columnFunctions.forEach(function(func) {
                columns += '<td>' + func(lineInfo) + '</td>'
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
    "Ingredient": translateIngredient("ingredient"),
    "Mass (grams)": translateIngredient("grams"),
    "Volume (mL)": translateIngredient("mL"),
    "Volume (US measures)": translateIngredient("us_measures"),
    "Original Line": translateIngredient("original_line"),
    "Parsed Info": translateIngredient("parsed_info"),
    "Choose one": translateIngredient("hide_column"),
};

function getDropdownDisplay() {
    var choices = "";
    $.each(ingredientsColumnChoices, function(display, func) {
        choices = choices
            + "<li><a href='#'>"
            + display
            + "</a></li>";
    });
    return choices;
}
