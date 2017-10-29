function runTests() {
    console.log("-------Running tests-------");
    console.log("-------Translation tests");
    runTranslationTests();
    console.log("-------Nutrition tests");
    runNutritionTests();
    console.log("-------Instructions tests");
    runInstructionsTests();
    console.log("-------Finished running tests-------");
}

function runTranslationTests() {
    jQuery.get('/recipe-translate/translation_test_cases.txt', function(data) {
        var inputLines = data.split("\n");
        var currentTestCase = null;
        var currentTestCategory = "";
        var lineCount = 0;
        var currentTestLineCount = null;
        inputLines.forEach(function(line) {
            lineCount++;
            if (line.length == 0) {
                return;
            }
            if (line[0] != " ") {
                // it is ok to call runTranslationTestCase on something 
                // with just input because there is nothing to test
                runTranslationTestCase(
                    currentTestCase,
                    currentTestLineCount,
                    currentTestCategory);
                currentTestCase = null;
                if (line[0] == "#") {
                    currentTestCategory = line.substring(1, line.length).trim();
                } else {
                    currentTestCase = {"input": line}
                    currentTestLineCount = lineCount;
                }
            } else if (line.trim().startsWith("multiplier")) {
                line = line.trim();
                var num = line.substring("multiplier".length + 1, line.length);
                currentTestCase["multiplier"] = num;
            } else {
                var splitIndex = line.indexOf("|");
                var translateKey = line.substring(0, splitIndex).trim();
                var expectedVal = line.substring(splitIndex + 1, line.length)
                    .trim();
                currentTestCase[translateKey] = expectedVal;
            }
        });
    });
}

function shouldOutputTestResult(testCategory) {
    if (testCategory == "difficult translations") {
        return false;
    }
    return true;
}

// TODO don't translate empty lines or lines that start with ###
// TODO don't translate lines after ===
function runTranslationTestCase(testCase, lineCount, testCategory) {
    if (testCase == null) {
        return;
    }
    // should only have output if failed
    var input = testCase["input"];
    testCase["original_line"] = input;
    testCase["hide_column"] = "";

    var ingredientInfo = new IngredientInfo(input);
    var translationKeys = [
        "ingredient",
        "grams",
        "mL",
        "us_measures",
        "original_line",
        "hide_column",
        "parsed_info",
    ]
    var multiplier = testCase["multiplier"];
    var allTranslations = getAllColumnTranslations(ingredientInfo, multiplier);
    translationKeys.forEach(function(key) {
        var output = allTranslations[key];
        // run for parsed_info but don't check the output
        if (key != "parsed_info") {
            var expectedOutput = testCase[key];
            if (shouldOutputTestResult(testCategory)
                    && expectedOutput != output) {
                var debugMsg = getDebugMessage(ingredientInfo);
                debugMsg = debugMsg.replace(/<br\/>/g, "\n");
                var errorMsg = (
                    "===" + testCategory + ", test line " + lineCount + "\n"
                    + "Failed translate line: " + input + "\n"
                    + "\tx" + multiplier + " to " + key + "\n"
                    + "\tExpected: " + expectedOutput + "\n"
                    + "\tGot: " + output + "\n"
                    + "\tDebug------\n" + debugMsg);
                console.log(errorMsg);
            }
        }
    });
}

function runNutritionTests() {
    var i1 = "1 cup water";
    var i2 = "1 cup flour";
    var i3 = "1 cup milk";
    var i4 = "something that doesn't parse";
    var allLines = [i1, i2, i3, i4];
    
    runNutritionTestCase([i1], 1, 1, formatNutrition(0, 0, 0, 0));
    runNutritionTestCase([i2], 1, 1, formatNutrition(455, 1.2, 95, 13));
    runNutritionTestCase([i3], 1, 1, formatNutrition(124, 4.9, 12, 8));
    runNutritionTestCase([i4], 1, 1, formatNutrition(0, 0, 0, 0));
    runNutritionTestCase(allLines, 1, 1, formatNutrition(579, 6.1, 107, 21));

    // multiplier
    runNutritionTestCase([i1], 2, 1, formatNutrition(0, 0, 0, 0));
    runNutritionTestCase([i2], 2, 1, formatNutrition(910, 2.4, 190, 26));
    runNutritionTestCase([i3], 2, 1, formatNutrition(248, 9.8, 24, 16));
    runNutritionTestCase([i4], 2, 1, formatNutrition(0, 0, 0, 0));
    runNutritionTestCase(allLines, 2, 1, formatNutrition(1158, 12.2, 214, 42));

    // servings
    runNutritionTestCase([i1], 2, 10, formatNutrition(0, 0, 0, 0));
    runNutritionTestCase([i2], 2, 10, formatNutrition(91, 0.24, 19, 2.6));
    runNutritionTestCase([i3], 2, 10, formatNutrition(24.8, 0.98, 2.4, 1.6));
    runNutritionTestCase([i4], 2, 10, formatNutrition(0, 0, 0, 0));
    runNutritionTestCase(
            allLines, 2, 10, formatNutrition(115.8, 1.22, 21.4, 4.2));
}


function runNutritionTestCase(
        ingredientLines, multiplier, numServings, expectedOutput) {
    var ingredientInfoLines = ingredientLines.map(function (line) {
        return new IngredientInfo(line);
    });
    var ingredientAmts = ingredientInfoLines.map(
        function (ingredientLine) {
            return calculateAmts(ingredientLine, multiplier);
        });
    var actualOutput = calculateNutrition(ingredientAmts, numServings);
    if (expectedOutput != actualOutput) {
        var msg = "=== Failed Nutrition Test \n"
            + "Input:\n\t" + ingredientLines.join("\n\t") + "\n"
            + "Expected:\n\t" + expectedOutput + "\n"
            + "Got: \n\t" + actualOutput;
        console.log(msg);
    }
}

function runInstructionsTests() {
    var i1 = "1 cup water";
    var i2 = "1 cup unsweetened applesauce";
    var i3 = "1/2 cup all-purpose flour";
    var i4 = "unable to parse salt";

    var instruction1 = "Mix the water and applesauce.";

    runInstructionTestCase(
            [i1, i2, i3, i4],
            [instruction1],
            1,
            ["us_measures"],
            {
                "water" : "1 cup water",
                "applesauce": "1 cup unsweetened applesauce",
            });

    var instruction2 = "Add the flour slowly.";
    var instruction3 = "No ingredients in this line.";
    runInstructionTestCase(
            [i1, i2, i3, i4],
            [instruction1, instruction2, instruction3],
            1,
            ["us_measures"],
            {
                "water" : "1 cup water",
                "applesauce": "1 cup unsweetened applesauce",
                "flour": "1/2 cup all purpose flour",
            });

    runInstructionTestCase(
            [i1, i2, i3, i4],
            [instruction1, instruction2, instruction3],
            2,  // Multiplier
            ["us_measures"],
            {
                "water" : "2 cups water",
                "applesauce": "2 cups unsweetened applesauce",
                "flour": "1 cup all purpose flour",
            });

    var i5 = "1 cup almond flour";
    runInstructionTestCase(
            [i1, i2, i3, i4, i5],  // 2 types of flour
            [instruction1, instruction2],
            1,
            ["us_measures"],
            {
                "water" : "1 cup water",
                "applesauce": "1 cup unsweetened applesauce",
                "flour": "1/2 cup all purpose flour + 1 cup almond flour",
            });

    var instruction4 = "Mix the all purpose flour and almond flour.";
    runInstructionTestCase(
            [i3, i5],  // 2 types of flour
            [instruction4],
            1,
            ["us_measures"],
            {
                "all purpose flour": "1/2 cup all purpose flour",
                "almond flour": "1 cup almond flour",
            });

    runInstructionTestCase(
            [
                "1 tbsp vanilla extract",
                "1 cup stuff (with some extra note)",
                "1 tsp baking powder",
            ],
            [
                "Line a baking sheet with paper.",  // should not baking powder
                "Mix the vanilla, stuff, and baking powder.",
            ],
            1,
            ["us_measures"],
            {
                "vanilla": "1 tbsp vanilla extract",
                "stuff": "1 cup stuff (with some extra note)",
                "baking powder": "1 tsp baking powder",
            });
}

function runInstructionTestCase(
        ingredientLines,
        instructions,
        multiplier,
        translationKeys,
        expectedHovers) {
    var ingredientInfoLines = ingredientLines.map(function (line) {
        return new IngredientInfo(line);
    });
    var ingTranslations = ingredientInfoLines.map(
        function (ingredientLine) {
            return getAllColumnTranslations(ingredientLine, multiplier);
        });
    var instructionInfoLines = getAllInstructionsInfo(
            instructions, ingTranslations);
    var output = constructInstructionDisplay(
            instructionInfoLines, translationKeys);

    $.each(expectedHovers, function(ingredientInText, hoverText) {
        var expectedHtml = '<span'
                + ' class="tooltip-element"'
                + ' data-toggle="tooltip"'
                + ' data-html="true"'
                + ' data-placement="top"'
                + ' title="' + hoverText + '">'
            + ingredientInText
            + '</span>';
        if (output.indexOf(expectedHtml) == -1) {
            var msg = "===Failed Instruction Test: \n"
                + "\tIngredients: " + ingredientLines + "\n"
                + "\tInstructions: " + instructions + "\n"
                + "\tExpected to find hover for ingredient: "
                    + ingredientInText + "\n"
                + "\tWith hover text: " + hoverText + "\n"
                + "\tActual html:\n" + output;
            console.log(msg);
        }
    });
}

