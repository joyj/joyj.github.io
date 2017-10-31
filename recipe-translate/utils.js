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
    var instructions = getInstructions(recipe);
    var instructionInfoLines = getAllInstructionsInfo(
            instructions, ingredientTranslations);
    var instructionDisplay = constructInstructionDisplay(
            instructionInfoLines, translationKeys);
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
            linesOfIngredientInfo.push(new IngredientInfo(line));
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
class IngredientInfo {
    constructor(originalLine) {
        this.originalLine = originalLine;
        this.measurementAmt = null;
        this.measurementUnit = null;
        this.parsedEverythingAfterUnit = null;
        this.parsedIngredientName = null;
        this.databaseIngredientName = null;
        this.databaseIngredientInfo = null;

        var parsedEverythingAfterUnit = this.separateLineToParts(
                this.originalLine);
        this.findIngredientInDatabase(parsedEverythingAfterUnit);
    }

    parseLineToTokens(line) {
        for (var i = 0; i < known_units.length; i++) {
            // add padding around all units, in case stuck to number (i.e. 5g)
            var unit = known_units[i];
            line = line.replace(
                new RegExp("(\\d+)" + unit, 'gi'),
                "$1 " + unit + " ");
        }
        return line.split(/\s+/).filter(token => token);  // any number of whitespace
    }

    separateLineToParts(line) {
        var tokens = this.parseLineToTokens(line);
        // find token that is a measurement, can have s at end
        // everything before is amt, after is ingredient
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            var token2words = "";  // fl oz is 2 words
            if (i + 1 < tokens.length) {
                var token2words = token + " " + tokens[i + 1];
            }

            // normalize tokens and check if we know about it
            if (token[token.length - 1] == "s") {
                token = token.substring(
                        0, token.length - 1);
            }
            if (token2words[token2words.length - 1] == "s") {
                token2words = token2words.substring(
                        0, token2words.length - 1);
            }
            var recognizedUnit = null;
            // handle the case when token matches but normalized doesn't.
            // E.g. when T is used for tablespoon
            if (known_units.includes(token)) {
                recognizedUnit = token;
            } else if (known_units.includes(token2words)) {
                recognizedUnit = token2words;
            } else if (known_units.includes(token.toLowerCase())) {
                recognizedUnit = token.toLowerCase();
            } else if (known_units.includes(token2words.toLowerCase())) {
                recognizedUnit = token2words.toLowerCase();
            }
            if (recognizedUnit != null) {
                this.measurementAmt = this.tryToTranslateAmt(tokens.slice(0, i));
                this.measurementUnit = recognizedUnit;
                this.parsedEverythingAfterUnit = tokens
                    .filter(token => !stop_words.includes(token))
                    .slice(i + 1, tokens.length)
                    .join(" ");
                return this.parsedEverythingAfterUnit;
            }
        }
    }

    tryToTranslateAmt(amtTokens) {
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

    tryToMatchIngredient(ingredient, ingredients_database) {
        // Remove any strange characters
        var ingredientTokens = ingredient.split(/\W+/);

        // try to find a matching substring
        for (var start = 0; start < ingredientTokens.length; start++) {
            for (var end = ingredientTokens.length; end > start; end--) {
                var normalizedIngredient = ingredientTokens
                    .slice(start, end)
                    .join(" ")
                    .toLowerCase();

                if (normalizedIngredient in ingredients_database) {
                    return normalizedIngredient;
                }

                // Try adding or removing an s TODO
                if (normalizedIngredient[normalizedIngredient.length - 1] == "s") {
                    var removeS = normalizedIngredient.substring(
                            0, normalizedIngredient.length - 1);
                    if (removeS in ingredients_database) {
                        return removeS;
                    }
                } else {
                    var addS = normalizedIngredient + "s"
                    if (addS in ingredients_database) {
                        return addS;
                    }
                }
            }
        }
        return null;
    }

    findIngredientInDatabase(everythingAfterUnit) {
        // if able to parse line to amt + unit + ingredient, try to find
        // ingredient
        if (everythingAfterUnit) {
            this.parsedIngredientName = this.tryToMatchIngredient(
                this.parsedEverythingAfterUnit, known_ingredients);
            this.databaseIngredientName = this.parsedIngredientName;
            if (this.parsedIngredientName != null) {
                this.databaseIngredientInfo =
                    known_ingredients[this.parsedIngredientName];
                if ("aka" in this.databaseIngredientInfo) {
                    this.databaseIngredientName =
                        this.databaseIngredientInfo["aka"];
                    if (this.databaseIngredientName in known_ingredients) {
                        // TODO trigger error if not in known_ingredients
                        this.databaseIngredientInfo = 
                            known_ingredients[this.databaseIngredientName];
                    }
                }
            }
        }
    }
}


// Note: used for testing
function getDebugMessage(ingredientLineObj) {
    if (ingredientLineObj == null || ingredientLineObj.measurementAmt == null) {
        return "Could not parse line into amt + unit + ingredient";
    }
    var amt = ingredientLineObj.measurementAmt;
    if (amt == null) {
        amt = "n/a";
    } else {
        amt = roundDecimal(amt);
    }
    var unit = ingredientLineObj.measurementUnit;
    if (unit == null) {
        unit = "n/a";
    }
    var ingredient = ingredientLineObj.databaseIngredientName;
    var parsedIngredient = ingredientLineObj.parsedIngredientName;
    if (ingredient == null) {
        ingredient = "n/a";
    } else if (ingredient != parsedIngredient) {
        ingredient = parsedIngredient + " --> " + ingredient;
    }
    var ingrInfo = ingredientLineObj.databaseIngredientInfo;
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
    var amt = ingredientLineObj.measurementAmt;
    var unit = ingredientLineObj.measurementUnit;
    var ingrInfo = ingredientLineObj.databaseIngredientInfo;

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

    var ingredientAfterUnit = ingredientLineObj.parsedEverythingAfterUnit;
    var parsedIngredient = ingredientLineObj.parsedIngredientName;
    var originalLine = ingredientLineObj.originalLine;

    translations["hide_column"] = "";
    translations["parsed_info"] = getDebugMessage(ingredientLineObj);
    translations["original_line"] = originalLine;
    if (parsedIngredient != null) {
        translations["ingredient"] = parsedIngredient;
    } else if (ingredientAfterUnit != null) {
        translations["ingredient"] = ingredientAfterUnit;
    } else {
        translations["ingredient"] = originalLine;
    }

    var ingredient = ingredientLineObj.databaseIngredientName;
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
function constructInstructionDisplay(instructionInfoLines, translationKeys) {
    // TODO sanitize input before dumping into html
    var result = '<ol class="instructions-list generated">';
    for (var instructionInfo of instructionInfoLines) {
        var line = instructionInfo.instruction;
        var nicknamesAndTranslationsList = instructionInfo.getIngredientNicknamesAndTranslations();
        for (var nicknameAndTranslations of nicknamesAndTranslationsList) {
            var nickname = nicknameAndTranslations[0];
            var ingredients = nicknameAndTranslations[1];
            var tooltipText = "";
            if (nickname != null && ingredients != null) {
                for (var translateKey of translationKeys) {
                    if (Object.values(hoverChoices)
                            .includes(translateKey)) {
                        if (tooltipText != "") {
                            tooltipText += "<br>";
                        }
                        for (var i = 0; i < ingredients.length; i++) {
                            if (i > 0) {
                                tooltipText += " + ";
                            }
                            var ingredient = ingredients[i];
                            tooltipText += ingredient[translateKey];
                        }
                    }
                }
                var hoverText = '<span'
                        + ' class="tooltip-element"'
                        + ' data-toggle="tooltip"'
                        + ' data-html="true"'
                        + ' data-placement="top"'
                        + ' title="' + tooltipText + '">'
                    + nickname
                    + '</span>';
                line = line.replace(new RegExp(nickname, 'gi'), hoverText);
            }
        }
        result += '<li class="instruction-line generated">' + line + '</li>';
    }
    return result + "</ol>";
}

class InstructionsInfo {
    constructor(instruction) {
        this.instruction = instruction;
        this.ingredients = {};  // ingredient nickname -> all translations
        this.ingredientsOrder = [];
    }

    print() {
        console.log("=================Ingredients Order=================");
        console.log(this.instruction);
        console.log(this.ingredients);
        console.log(this.ingredientsOrder);
    }

    tryToAddIngredient(ingredientTranslations) {
        var ingredientName = ingredientTranslations["ingredient"];
        var ingredientNicknames = this.generateIngredientNicknames(
                ingredientName);

        for (var nickname of ingredientNicknames) {
            if (this.instruction.match(nickname) != null) {
                if (!(nickname in this.ingredients)) {
                    this.ingredients[nickname] = [];
                    this.ingredientsOrder.push(nickname);
                }
                this.ingredients[nickname].push(ingredientTranslations);
                return true;
            }
        }
        return false;
    }

    getIngredientNicknamesAndTranslations() {
        // TODO combine ingredients if necessary
        var nicknamesAndTranslations = [];
        for (var ingredient of this.ingredientsOrder) {
            nicknamesAndTranslations.push([
                ingredient,
                this.ingredients[ingredient],
            ]);
        }
        return nicknamesAndTranslations;
    }

    generateIngredientNicknames(ingredient) {
        if (ingredient == null || ingredient == undefined) {
            return [];
        }
        var ingredientTokens = ingredient.split(/\W+/).filter(token => token);
        var ingredientSubstrings = [];
        for (var start = 0; start < ingredientTokens.length; start++) {
                var ingredient = ingredientTokens
                    .slice(start, ingredientTokens.length)
                    .join(" ");
                ingredientSubstrings.push(ingredient);
        }
        return ingredientSubstrings;
    }


}

function getAllInstructionsInfo(instructions, ingTranslations) {
    var instructionsInfoLines = [];
    var remainingIngredients = ingTranslations;
    for (var line of instructions) {
        var instructionsInfo = new InstructionsInfo(line);
        var unusedIngredients = [];
        for (var ingredient of remainingIngredients) {
            var matchedIngredient = instructionsInfo
                .tryToAddIngredient(ingredient);

            if (!matchedIngredient){
                unusedIngredients.push(ingredient);
            }
        }
        remainingIngredients = unusedIngredients;
        instructionsInfoLines.push(instructionsInfo);
    }
    return instructionsInfoLines;
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
