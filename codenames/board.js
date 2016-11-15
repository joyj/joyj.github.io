function populateBoardFromInputSeed(isPlayerView) {
  isPlayerView = isPlayerView || false;
  $('#board').empty();
  var seed = $('#seed').val();
  var wordList = genWords(seed);
  generateBoard(wordList, 5);

  var firstTeam = getFirstTeam(seed);
  var colorList = genBoardOwners(seed, firstTeam);
  populateColors(colorList);

  $('#first-team').attr('data-cell-type', firstTeam);
  $('.card').click(function() {
      $(this).toggleClass("gray");
      displayUpdatedScores(isPlayerView);
      if (isPlayerView) {
          if (!$(this).hasClass("gray")) {
              if ($(this).attr('data-cell-type') == cellOwner.BOMB) {
                  $('#you-lost').modal('show');
              }
              $(this).text("---");
          } else {
              $(this).text($(this).attr('word'));
          }
      } else {
          if ($(this).hasClass("gray")) {
              $(this).text("---");
          } else {
              $(this).text($(this).attr('word'));
          }
      }
  });
  if (isPlayerView) {
     $('.card').toggleClass("gray");
  }
  displayUpdatedScores(isPlayerView);
}


function populateBoard(noColor) {
  var seed = genSeedString();
  $('#seed').val(seed);
  populateBoardFromInputSeed(noColor);
}

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
        '<button class="btn-lg card" type="button" data-cell-type="UNKNOWN" word="' + word + '">' +
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

var displayUpdatedScores = function(isPlayerView) {
    $('#scores').empty();
    _.each(cellOwner, function(name, key) {
        if (name != cellOwner.UNKNOWN) {
            var queryString = '.card[data-cell-type="' + name + '"]'
            var totalNum = $(queryString).length
            var solvedNum = $('.gray' + queryString).length
            var remaining = totalNum - solvedNum;
            if (isPlayerView) {
                remaining = solvedNum;
            }
            $('#scores').append('<div class="score" data-cell-type="' + name + '"> ' + remaining + ' Remaining</div>');
        }
    });
}
