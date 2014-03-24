/* global userTreasures: true */

(function(){

  'use strict';

  $(document).ready(initialize);

  function initialize(){
    fillTreasureList();
  }

  function fillTreasureList(){
    var totalVal = 0;

    _.forEach(userTreasures, function(t){
      totalVal += t.val;
      var count = $('#'+t.name).text();
      count++;
      $('#'+t.name).text(count);
    });

    $('#totalVal').text('Total Value: '+totalVal);
  }

})();

