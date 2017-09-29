function runTests() {
    console.log("-------Running tests.");
    jQuery.get('/recipe-translate/test_cases.txt', function(data) {
        var inputLines = data.split("\n");
        var currentTestCase = null;
        var currentTestCategory = "";
        inputLines.forEach(function(line) {
            if (line.length == 0) {
                return;
            }
            if (line[0] != " ") {
                // it is ok to call runTestCase on something with just input
                // because there is nothing to test
                runTestCase(currentTestCase, currentTestCategory);
                currentTestCase = null;
                if (line[0] == "#") {
                    currentTestCategory = line.substring(1, line.length).trim();
                } else {
                    currentTestCase = {"input": line}
                }
            } else if (line.trim().startsWith("multiplier")) {
                line = line.trim();
                var num = line.substring("multiplier".length + 1, line.length);
                currentTestCase["multiplier"] = num;
            } else {
                var splitIndex = line.indexOf("|");
                var translateKey = line.substring(0, splitIndex).trim();
                var expectedVal = line.substring(splitIndex + 1, line.length).trim();
                currentTestCase[translateKey] = expectedVal;
            }
        });
        console.log("-------Finished running tests.");
    });
}

function shouldOutputTestResult(testCategory) {
    if (testCategory == "difficult cases") {
        return false;
    }
    return true;

}

// TODO also run for parsed_info, hide_column, and original_line
function runTestCase(testCase, testCategory) {
    if (testCase == null) {
        return;
    }
    // should only have output if failed
    var input = testCase["input"];
    if (!("original_line" in testCase)) {
        testCase["original_line"] = input;
    }
    var multiplier = testCase["multiplier"];
    testCase["hide_column"] = "";
    testCase["us_measures"] = "not implemented yet :(";  // TODO

    var ingredientInfo = parseLineToInfo(input);
    var translationKeys = [
        "ingredient",
        "grams",
        "mL",
        "us_measures",
        "original_line",
        "hide_column",
        "parsed_info",
    ]
    translationKeys.forEach(function(key) {
        var output = translateIngredient(ingredientInfo, key, multiplier);
        // run for parsed_info but don't check the output
        if (key != "parsed_info") {
            var expectedOutput = testCase[key];
            if (shouldOutputTestResult(testCategory)
                    && expectedOutput != output) {
                var debugMsg = getDebugMessage(ingredientInfo);
                debugMsg = debugMsg.replace(/<br\/>/g, "\n");
                var errorMsg = ("===" + testCategory + "\n"
                    + "Failed translate line to " + key + "\n"
                    + "\tInput: " + input + "\n"
                    + "\tExpected: " + expectedOutput + "\n"
                    + "\tGot: " + output + "\n"
                    + "\tDebug------\n" + debugMsg);
                console.log(errorMsg);
            }
        }
    });
}
