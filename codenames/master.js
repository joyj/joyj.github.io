var generateBoard = function(words, wordsPerRow) {
  var cellNum = 0;
  for (let word of words) {
    if (cellNum % wordsPerRow == 0) {
      addRowToBoard();
    }
    insertWordInLastRow(word, cellNum)
    cellNum++;
  }
}

var addRowToBoard = function() {
  $('#board').append('<div></div>');
}

var insertWordInLastRow = function(word, cellNum) {
  $('#board > div:last-child').append(
      '<div class="board-cell" id="cell' + cellNum + '">' +
        '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-cell-type="UNKNOWN">' +
        word +
        '</button>' +
      '</div>'
  );
}

var populateColors = function(colorList) {
  for (var i = 0; i < colorList.length; i++) {
    $('#cell' + i + ' button').attr('data-cell-type', colorList[i]);
  }
}
