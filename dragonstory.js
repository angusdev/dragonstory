/*jshint devel:true */
/*global $,org,breeds */
(function(){
'use strict';

function registerNS(ns) {
  var nsParts = ns.split('.');
  var root = window;

  for (var i=0; i<nsParts.length; i++) {
    if (typeof root[nsParts[i]] === 'undefined') {
      root[nsParts[i]] = {};
    }
    root = root[nsParts[i]];
  }
}

registerNS("org.ellab.dragonstory");

var BREED_DATA_VERSION = 1;
var BATTLE_DATA_VERSION = 1;

org.ellab.dragonstory.capitalize = function(s) {
  if (typeof s === 'string' && s.length > 0) {
    return s.charAt(0).toUpperCase() + s.substring(1);
  }
  else {
    return s;
  }
};

org.ellab.dragonstory.clearDragonBtn = function() {
  $('[data-role="dragon-prefix-btn-group"]').empty();
  $('[data-role="dragon-name-btn-group"]').empty();
};

org.ellab.dragonstory.makeDragonBtn = function() {
  var $btngroup = $('[data-role="dragon-prefix-btn-group"]');
  for (var i=0 ; i<26 ; i++) {
    var val = String.fromCharCode(65 + i);
    $btngroup.append('<label class="btn btn-default"><input type="radio" name="' + $btngroup.data('radio-name') + '" value="' + val + '">' + val  + '</label>');
  }
  $btngroup.on('change', ':radio', function() {
    if (breeds) {
      var $btngroup = $(this).closest('.btn-group');
      var prefix = $btngroup.find(':checked').val();
      if (prefix) {
        var $target = $($btngroup.data('for')).empty();
        $target.closest('.form-group').find('span').remove();
        for (var dragonid in breeds) {
          var dragon = breeds[dragonid];
          if (dragon.name && dragon.name.length > 0 && dragon.name.charAt(0).toUpperCase() === prefix) {
            $target.append('<label class="btn btn-default"><input type="radio" name="' + $target.data('radio-name') + '" value="' + dragonid + '">' + dragon.name + '</label>');
          }
        }

        $('[data-role="result"]').empty();
      }
    }
  });
};

org.ellab.dragonstory.selectDragon = function(btngroup, dragonid, dragonname) {
  var $btngroup = $(btngroup);
  $btngroup.find(':radio[value="' + dragonname.charAt().toUpperCase() + '"]').first().click();
  $($btngroup.data('for')).find(':radio[value="' + dragonid + '"]').first().click();
};

org.ellab.dragonstory.clearLevelBtn = function() {
  $('[data-role="dragon-level-btn-group"]').empty();
};

org.ellab.dragonstory.makeLevelBtn = function() {
  var $btngroup = $('[data-role="dragon-level-btn-group"]');
  for (var i=1 ; i<=20; i++) {
    $btngroup.append('<label class="btn btn-default' + (i===20?' active':'') + '"><input type="radio" name="' + $btngroup.data('radio-name') + '" value="' + i + '">' + i + '</label>');
  }
  $btngroup.find(':radio[value=20]').prop('checked', true);
};

org.ellab.dragonstory.clearStoredBreedData = function() {
  if (localStorage) {
    localStorage.removeItem('ellab-dragonstory-breed');
  }
};

org.ellab.dragonstory.getStoredBreedData = function() {
  var stored = localStorage?localStorage.getItem('ellab-dragonstory-breed'):null;
  if (stored) {
    try {
      stored = JSON.parse(stored);
      if (stored.version !== BREED_DATA_VERSION) {
        stored = null;
      }
    }
    catch (ex) {
      stored = null;
    }
  }

  return stored;
};

org.ellab.dragonstory.loadBreedData = function () {
  var deferred = $.Deferred();

  var stored = this.getStoredBreedData();
  if (stored && stored.javascriptText) {
    window.setTimeout(function() {
      deferred.resolve(stored.javascriptText);
    }, 0);
  }
  else {
    $.ajax('http://dragon-story.wikia.com/wiki/Breeding_Calculator').done(function(data) {
      data = data.replace(/[\r\n]/g, '');
      var prefix = '<div id="breedingcalculatordata" style="display:none">';
      var pos = data.indexOf(prefix);
      if (pos >= 0) {
        data = data.substring(pos + prefix.length);
        pos = data.indexOf('</div>');
        if (pos >= 0) {
          data = data.substring(0, pos);
          // for some reason (maybe YQL) there is a <p></p> surrounding
          data = data.replace(/^\s*<[^>]*>\s*/, '').replace(/\s*<\/[^>]*>\s*$/, '');
        }

        // store the result
        if (!stored) {
          stored = { version: BREED_DATA_VERSION };
        }
        stored.javascriptText = data;
        if (localStorage) {
          localStorage.setItem('ellab-dragonstory-breed', JSON.stringify(stored));
        }

        deferred.resolve(data);
      }
    });
  }

  return deferred;
};

org.ellab.dragonstory.clearStoredBattleData = function() {
  if (localStorage) {
    localStorage.removeItem('ellab-dragonstory-battle');
  }
};

org.ellab.dragonstory.getStoredBattleData = function() {
  var stored = localStorage?localStorage.getItem('ellab-dragonstory-battle'):null;
  if (stored) {
    try {
      stored = JSON.parse(stored);
      if (stored.version !== BATTLE_DATA_VERSION) {
        stored = null;
      }
    }
    catch (ex) {
      stored = null;
    }
  }

  return stored;
};

org.ellab.dragonstory.loadBattleData = function () {
  var deferred = $.Deferred();

  var stored = this.getStoredBattleData();
  if (stored && stored.javascriptText) {
    window.setTimeout(function() {
      deferred.resolve(stored.javascriptText);
    }, 0);
  }
  else {
    $.ajax('http://dragon-story.wikia.com/wiki/Battle_Arena').done(function(data) {
      var prefix = '<div id="battlearenadata" style="display:none">';
      var pos = data.indexOf(prefix);
      if (pos >= 0) {
        data = data.substring(pos + prefix.length);
        pos = data.indexOf('</div>');
        if (pos >= 0) {
          data = data.substring(0, pos);
          // for some reason (maybe YQL) there is a <p></p> surrounding
          data = data.replace(/^\s*<[^>]*>\s*/, '').replace(/\s*<\/[^>]*>\s*$/, '');
        }

        // store the result
        if (!stored) {
          stored = { version: BATTLE_DATA_VERSION };
        }
        stored.javascriptText = data;
        if (localStorage) {
          localStorage.setItem('ellab-dragonstory-battle', JSON.stringify(stored));
        }

        deferred.resolve(data);
      }
    });
  }

  return deferred;
};

})();
