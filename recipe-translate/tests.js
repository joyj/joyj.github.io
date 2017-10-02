function runTests() {
    console.log("-------Running tests.");
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
                // it is ok to call runTestCase on something with just input
                // because there is nothing to test
                runTestCase(currentTestCase, currentTestLineCount, currentTestCategory);
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

// TODO don't translate empty lines or lines that start with ###
// TODO don't translate lines after ===
function runTestCase(testCase, lineCount, testCategory) {
    if (testCase == null) {
        return;
    }
    // should only have output if failed
    var input = testCase["input"];
    testCase["original_line"] = input;
    testCase["hide_column"] = "";

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
    var multiplier = testCase["multiplier"];
    translationKeys.forEach(function(key) {
        var output = translateIngredient(ingredientInfo, key, multiplier);
        // run for parsed_info but don't check the output
        if (key != "parsed_info") {
            var expectedOutput = testCase[key];
            if (shouldOutputTestResult(testCategory)
                    && expectedOutput != output) {
                var debugMsg = getDebugMessage(ingredientInfo);
                debugMsg = debugMsg.replace(/<br\/>/g, "\n");
                var errorMsg = ("===" + testCategory + ", test line " + lineCount + "\n"
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
