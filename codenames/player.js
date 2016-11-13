var generateBoard = function(words, wordsPerRow) {
  var cellNum = 0;
  for (let word of words) {
    if (cellNum % wordsPerRow == 0) {
      addRowToBoard();
    }
    insertWordInLastRow(word, cellNum)
    cellNum++;
  }

  $('.board-cell-menu a').click(function() {
    var cellNum = $(this).attr('data-cell-num');
    var cellType = $(this).attr('data-cell-type');
    $('#cell' + cellNum + " button").attr('data-cell-type', cellType);
  });
}

var addRowToBoard = function() {
  $('#board').append('<div></div>');
}

var insertWordInLastRow = function(word, cellNum) {
  $('#board > div:last-child').append(
      '<div class="dropdown board-cell" id="cell' + cellNum + '">' +
        '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-cell-type="UNKNOWN">' +
        word +
        '</button>' +
        buildColorMenu(cellNum) +
      '</div>'
  );
}

var buildColorMenu = function(cellNum) {
  return '<ul class="dropdown-menu board-cell-menu">' +
    '<li><a href="#" data-cell-num="' + cellNum + '" data-cell-type="TEAM_A">Blue</a></li>' +
    '<li><a href="#" data-cell-num="' + cellNum + '" data-cell-type="TEAM_B">Red</a></li>' +
    '<li><a href="#" data-cell-num="' + cellNum + '" data-cell-type="NEUTRAL">White</a></li>' +
    '<li><a href="#" data-cell-num="' + cellNum + '" data-cell-type="BOMB">Black</a></li>' +
    '<li><a href="#" data-cell-num="' + cellNum + '" data-cell-type="UNKNOWN">Unset</a></li>' +
  '</ul>';
}
