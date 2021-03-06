/*jshint devel:true */
/*global $,org,breeds,type_image_url,g_mydragon,g_db */
(function(){
'use strict';

var RARITY_DESC = [ '', 'Common', 'Rare', 'Super Rare', 'Ultra Rare'];

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

var ds = org.ellab.dragonstory;

var BREED_DATA_VERSION = 1;
var BATTLE_DATA_VERSION = 1;
var MYDRAGON_DATA_VERSION = 1;
var EGG_DATA_VERSION = 1;

org.ellab.dragonstory.capitalize = function(s) {
  if (typeof s === 'string' && s.length > 0) {
    return s.replace(/\b[a-z]/g, function(letter) { return letter.toUpperCase(); } );
  }
  else {
    return s;
  }
};

// doesn't work on decimal
org.ellab.dragonstory.thousandSep = function(n) {
  return ('' + n).replace(/\d(?=(?:\d{3})+(?!\d))/g, '$&,');
};

org.ellab.dragonstory.extract = function(s, prefix, suffix) {
  var i;
  if (prefix) {
    i = s.indexOf(prefix);
    if (i >= 0) {
      s = s.substring(i + prefix.length);
    }
    else {
      return '';
    }
  }

  if (suffix) {
    i = s.indexOf(suffix);
    if (i >= 0) {
      s = s.substring(0, i);
    }
    else {
      return '';
    }
  }

  return s;
};

org.ellab.dragonstory.getRarityDesc = function(r) {
  return RARITY_DESC[r];
};

org.ellab.dragonstory.getTypeHTML = function(types, width) {
  var html = '';

  if (types) {
    types.sort();
  }

  (types || []).forEach(function(type) {
    html += ' <img' + (width?' width="' + width + '"':'') + ' src="' + type_image_url[type] + '"/> ';
  });

  return html;
};

// score = rarity * level
//   where, rarity = :
//     Common: 1
//     Rare: 3
//     Super Rare: 6
//     Ultra Rare: 10
org.ellab.dragonstory.calcDragonScore = function(rarity, level) {
  return level * (rarity === 4?10:(rarity === 3?6:(rarity === 2?3:1)));
};

org.ellab.dragonstory.secondsToString = function(seconds) {
  if (seconds < 3600) {
    return seconds + ' seconds';
  }
  else {
    return (seconds / 3600) + ' hours';
  }
};

org.ellab.dragonstory.getIncubationText = function(incubationText) {
  return incubationText.split('_').reverse().slice(1).reverse().join(' ');
};

org.ellab.dragonstory.getIncubationSeconds = function(incubationText) {
  var splitted = incubationText.split('_');
  return parseInt(splitted[0], 10) * (splitted[1]==='seconds'?1:3600);
};

/*
   ####                                             ####           #      #
    #  #                                             #  #          #      #
    #  #  # ##    ###    ## #   ###   # ##           #  #  #   #  ####   ####    ###   # ##    ###
    #  #  ##  #      #  #  #   #   #  ##  #          ###   #   #   #      #     #   #  ##  #  #
    #  #  #       ####   ##    #   #  #   #          #  #  #   #   #      #     #   #  #   #   ###
    #  #  #      #   #  #      #   #  #   #          #  #  #  ##   #  #   #  #  #   #  #   #      #
   ####   #       ####   ###    ###   #   #         ####    ## #    ##     ##    ###   #   #  ####
                        #   #
                         ###
*/
org.ellab.dragonstory.clearDragonBtns = function() {
  $('[data-role="dragon-prefix-btn-group"]').empty();
  $('[data-role="dragon-name-btn-group"]').empty();
  $('[data-role="dragon-level-btn-group"]').empty();
  $('[data-role="dragon-type-btn-group"]').empty();
  $('[data-role="dragon-incubation-btn-group"]').empty();
};

org.ellab.dragonstory.makeDragonBtns = function() {
  ds.makeDragonBtn();
  ds.makeLevelBtn();
  ds.makeTypeBtn();
  ds.makeIncubationBtn();
};

org.ellab.dragonstory.makeDragonBtn = function() {
  var $btngroup = $('[data-role="dragon-prefix-btn-group"]');
  $btngroup.each(function() {
    var $this = $(this);

    var hasall = $this.data('hasall');
    if (hasall) {
      $this.append('<label class="btn btn-default' + (hasall==='selected'?' active':'') + '"><input type="radio" name="' +
                   $this.data('radio-name') + '" value="*">All</label>');
    }

    for (var i=0 ; i<26 ; i++) {
      var val = String.fromCharCode(65 + i);
      $this.append('<label class="btn btn-default"><input type="radio" name="' + $this.data('radio-name') + '" value="' + val + '">' + val  + '</label>');
    }
  }).find(':radio[value="*"]').prop('checked', true); // select the all button

  $btngroup.filter(function() {
    return $(this).closest('.btn-group').data('for')?true:false;
  }).on('change', ':radio', function() {
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

org.ellab.dragonstory.selectDragon = function(btngroup, dragonid) {
  ds.selectPrefix(btngroup, dragonid);
  $($(btngroup).data('for')).find(':radio[value="' + dragonid + '"]').first().click();
};

org.ellab.dragonstory.selectPrefix = function(btngroup, dragonid) {
  $(btngroup).find(':radio[value="' + g_db.byID(dragonid).breed.name.charAt(0).toUpperCase() + '"]').first().click();
};

org.ellab.dragonstory.resetRadio = function(selector, selectFirst) {
  var $selector = $(selector);

  $selector.find('label').each(function() {
    $(this).removeClass('active').find(':radio').prop('checked', false);
  });

  if (selectFirst) {
    $selector.find('label').first().addClass('active').find(':radio').prop('checked', true);
  }

  return $selector;
};

org.ellab.dragonstory.makeLevelBtn = function() {
  return $('[data-role="dragon-level-btn-group"]').each(function() {
    var $this = $(this);
    for (var i=1 ; i<=20; i++) {
      $this.append('<label class="btn btn-default' + (i===20?' active':'') + '"><input type="radio" name="' + $this.data('radio-name') + '" value="' + i + '">' + i + '</label>');
    }
  }).find(':radio[value=20]').prop('checked', true);  // check the level 20
};

org.ellab.dragonstory.makeTypeBtn = function() {
  return $('[data-role="dragon-type-btn-group"]').each(function() {
    var $this = $(this);

    var hasall = $this.data('hasall');
    if (hasall) {
      $this.append('<label class="btn btn-default' + (hasall==='selected'?' active':'') + '"><input type="radio" name="' + $this.data('radio-name') + '" value="*">All</label>');
    }
    for (var type in g_db.types) {
      $this.append('<label class="btn btn-default"><input type="radio" name="' + $this.data('radio-name') + '" value="' + type + '">' +
                   '<img src="' + g_db.types[type].img + '" width="16"/></label>');
    }
    if (hasall === 'selected') {
      $this.find(':radio[value="*"]').prop('checked', true);
    }
  });
};

org.ellab.dragonstory.makeIncubationBtn = function() {
  return  $('[data-role="dragon-incubation-btn-group"]').each(function() {
    var $this = $(this);

    var hasall = $this.data('hasall');
    if (hasall) {
      $this.append('<label class="btn btn-default' + (hasall==='selected'?' active':'') + '"><input type="radio" name="' + $this.data('radio-name') + '" value="*">All</label>');
    }

    var minhour = $this.data('min-hour');
    if (minhour) {
      // minhour === 1, value = '<7200'
      $this.append('<label class="btn btn-default"><input type="radio" name="' + $this.data('radio-name') + '" value="<' + ((minhour + 1) * 3600) + '">&lt;= ' + minhour + '</label>');
    }
    for (var incubation in g_db.incubation) {
      if (!minhour || incubation > minhour * 3600) {
        $this.append('<label class="btn btn-default"><input type="radio" name="' + $this.data('radio-name') + '" value="' + incubation + '">' +
                         (incubation / 3600) + '</label>');
      }
    }
    if (hasall === 'selected') {
      $this.find(':radio[value="*"]').prop('checked', true);
    }
  });
};

org.ellab.dragonstory.getIncubationBtnSelectedRange = function(btngroup) {
  var incubation = $(btngroup).find(':checked').val();
  var incubationFrom = -1;
  var incubationTo = 99 * 3600;
  if (incubation) {
    if (incubation.indexOf('<') !== -1) {
      incubationFrom = 0;
      incubationTo = parseInt(incubation.replace('<', ''), 10);
    }
    else if (incubation.indexOf('>') !== -1) {
      incubationFrom = parseInt(incubation.replace('<', ''), 10);
      incubationTo = 99 * 3600;
    }
    else if (incubation !== '*') {
      incubationFrom = parseInt(incubation, 10);
      incubationTo = incubationFrom + 1;
    }

    return { from:incubationFrom, to:incubationTo };
  }
  else {
    return null;
  }
};

/*
   ####                            #         ####           #
    #  #                           #          #  #          #
    #  #  # ##    ###    ###    ## #          #  #   ###   ####    ###
    ###   ##  #  #   #  #   #  #  ##          #  #      #   #         #
    #  #  #      #####  #####  #   #          #  #   ####   #      ####
    #  #  #      #      #      #  ##          #  #  #   #   #  #  #   #
   ####   #       ###    ###    ## #         ####    ####    ##    ####
*/
org.ellab.dragonstory.loadBreedData = function () {
  var deferred = $.Deferred();

  var stored = ds.StorageManager.getVersionedData('breed', BREED_DATA_VERSION);
  if (stored && stored.javascriptText) {
    window.setTimeout(function() {
      deferred.notify({ completed:true, fromCache:true });
      deferred.resolve(stored.javascriptText);
    }, 0);
  }
  else {
    window.setTimeout(function() {
      deferred.notify({ beforeAjax:true });
    }, 0);
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
        stored.javascriptText = data.replace(/, warden: \{[^}]+\}/, '').replace(/, fourleaf: \{[^}]+\}/, '');
        stored.updateTime = new Date();
        if (localStorage) {
          localStorage.setItem('ellab-dragonstory-breed', JSON.stringify(stored));
        }

        deferred.notify({ completed:true, afterAjax:true });
        deferred.resolve(data);
      }
    });
  }

  return deferred.promise();
};

/*
   ####           #      #      ##                  ####           #
    #  #          #      #       #                   #  #          #
    #  #   ###   ####   ####     #     ###           #  #   ###   ####    ###
    ###       #   #      #       #    #   #          #  #      #   #         #
    #  #   ####   #      #       #    #####          #  #   ####   #      ####
    #  #  #   #   #  #   #  #    #    #              #  #  #   #   #  #  #   #
   ####    ####    ##     ##    ###    ###          ####    ####    ##    ####
*/
org.ellab.dragonstory.loadBattleData = function () {
  var deferred = $.Deferred();

  var stored = ds.StorageManager.getVersionedData('battle', BATTLE_DATA_VERSION);
  if (stored && stored.javascriptText) {
    window.setTimeout(function() {
      deferred.notify({ completed:true, fromCache:true });
      deferred.resolve(stored.javascriptText);
    }, 0);
  }
  else {
    window.setTimeout(function() {
      deferred.notify({ beforeAjax:true });
    }, 0);
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
        stored.updateTime = new Date();
        if (localStorage) {
          localStorage.setItem('ellab-dragonstory-battle', JSON.stringify(stored));
        }

        deferred.notify({ completed:true, afterAjax:true });
        deferred.resolve(data);
      }
    });
  }

  return deferred.promise();
};

/*
   #####                       ####           #
   #                            #  #          #
   #       ## #   ## #          #  #   ###   ####    ###
   ####   #  #   #  #           #  #      #   #         #
   #       ##     ##            #  #   ####   #      ####
   #      #      #              #  #  #   #   #  #  #   #
   #####   ###    ###          ####    ####    ##    ####
          #   #  #   #
           ###    ###
*/
org.ellab.dragonstory.parseEggTr = function(t) {
  if (t.indexOf('<th') !== -1) {
    // this is header, skip it
    return null;
  }

  var tds = [];
  var td;
  while (t) {
    // need second extract since: <td>xx</td> => >xx, <td aaa>xx</td> =>  aaa>xx
    td = ds.extract(ds.extract(t, '<td', '</td>'), '>');
    t = ds.extract(t, '</td>');
    if (td) {
      tds.push(td);
    }
  }

  var parsed = {};
  var attrs = [['eggimg', 'url'], ['name', 'title'], 'type', 'avail', 'rarity'];
  var tdvalue;
  for (var i=0 ; i<tds.length ; i++) {
    var attrs2 = attrs[i];
    if (!Array.isArray(attrs[i])) {
      // build a pseudo array
      attrs2 = [attrs2];
    }
    for (var j=0 ; j<attrs2.length ; j++) {
      var attr = attrs2[j];
      var tag1 = '<p>', tag2 = '</p>';
      var findLast = true;
      if (attr === 'eggimg' || attr === 'image') {
        tag1 = 'src="';
        tag2 = '"';
      }
      else if (attr === 'name') {
        tag1 = '>';
        tag2 = '</a>';
      }
      else if (attr === 'title') {
        tag1 = 'title="';
        tag2 = '"';
      }
      else if (attr == 'url') {
        tag1 = '<a href="';
        tag2 = '"';
        findLast = false;
      }

      var tdhtml = tds[i];
      while (tdhtml) {
        // loop to the last matches
        tdvalue = ds.extract(tdhtml, tag1, tag2);
        if (tdvalue) {
          parsed[attr] = tdvalue.replace(/^\s+/, '').replace(/\s+$/, '');
        }

        if (findLast) {
          tdhtml = ds.extract(tdhtml, tag2);
        }
        else {
          // force terminate
          tdhtml = null;
        }
      }
    }
  }

  return parsed;
};

org.ellab.dragonstory.parseEgg = function(t) {
  var data = {};

  t = ds.extract(t, '<div id="toctitle">', '<a class="button forum-new-post"');
  var tr;
  while (t) {
    tr = ds.extract(t, '<tr>', '</tr>');
    t = ds.extract(t, '</tr>');
    if (tr) {
      var parsed = ds.parseEggTr(tr);
      if (parsed) {
        data[parsed.name] = parsed;
      }
    }
  }

  return data;
};

org.ellab.dragonstory.loadEggData = function () {
  var deferred = $.Deferred();

  var stored = ds.StorageManager.getVersionedData('egg', EGG_DATA_VERSION);
  if (stored) {
    window.setTimeout(function() {
      deferred.notify({ completed:true, fromCache:true });
      deferred.resolve(stored.data);
    }, 0);
  }
  else {
    window.setTimeout(function() {
      deferred.notify({ beforeAjax:true });
    }, 0);
    $.ajax('http://dragon-story.wikia.com/wiki/Eggs').done(function(t) {
      var data = ds.parseEgg(t);

      if (data) {
        // store the result
        if (!stored) {
          stored = { version: EGG_DATA_VERSION };
        }
        stored.data = data;
        stored.updateTime = new Date();
        if (localStorage) {
          localStorage.setItem('ellab-dragonstory-egg', JSON.stringify(stored));
        }

        deferred.notify({ completed:true, afterAjax:true });
        deferred.resolve(data);
      }
    });
  }

  return deferred.promise();
};

/*
    ###    #                                        #   #
   #   #   #                                        #   #
   #      ####    ###   # ##    ###    ## #   ###   ## ##   ###   # ##    ###    ## #   ###   # ##
    ###    #     #   #  ##  #      #  #  #   #   #  # # #      #  ##  #      #  #  #   #   #  ##  #
       #   #     #   #  #       ####   ##    #####  #   #   ####  #   #   ####   ##    #####  #
   #   #   #  #  #   #  #      #   #  #      #      #   #  #   #  #   #  #   #  #      #      #
    ###     ##    ###   #       ####   ###    ###   #   #   ####  #   #   ####   ###    ###   #
                                      #   #                                     #   #
                                       ###                                       ###
*/
org.ellab.dragonstory.StorageManager = {
  KEY_PREFIX: 'ellab-dragonstory-',

  settings: [
    'breed', 'battle', 'egg', 'mydragon'
  ],

  getStorageInfo: function() {
    function calcSize(s) {
      return s?JSON.stringify(s).length:0;
    }

    var result = {};
    var totalSize = 0;

    if (localStorage) {
      for (var i=0 ; i<this.settings.length ; i++) {
        var key = this.settings[i];
        var item = this.getItem(key);
        var size = calcSize(item);
        var version = 0;
        var updateTime = null;
        try {
          var obj = JSON.parse(item);
          version = obj.version;
          updateTime = obj.updateTime;
        }
        catch (err) {
        }

        totalSize += size;

        result[key] = {
          key: key,
          name: ds.capitalize(key),
          size: size,
          version: version,
          updateTime: updateTime
        };
      }

      result['total'] = {
        key: 'total',
        name: 'Total',
        size: totalSize
      };

      result['all'] = {
        key: 'all',
        name: 'All (' + document.location.host + ')',
        size: JSON.stringify(localStorage).length
      };
    }

    return result;
  },

  getItem: function(key) {
    return localStorage?localStorage.getItem(this.KEY_PREFIX + key):null;
  },

  removeItem: function(key) {
    if (localStorage) {
      localStorage.removeItem(this.KEY_PREFIX + key);
    }
  },

  // empty all dragonstory storage
  removeTotal: function(key) {
    if (localStorage) {
      for (var i=0 ; i<this.settings.length ; i++) {
        localStorage.removeItem(this.KEY_PREFIX + this.settings[i]);
      }
    }
  },

  removeExternalData: function() {
    this.removeItem('breed');
    this.removeItem('battle');
    this.removeItem('egg');
  },

  // empty the entire localStorage
  removeAll: function(key) {
    if (localStorage) {
      localStorage.clear();
    }
  },

  // Get the data of specified version, return null if not found or the version is incorrect
  getVersionedData: function(key, expectedVersion) {
    var stored = localStorage?localStorage.getItem(this.KEY_PREFIX + key):null;
    if (stored) {
      try {
        stored = JSON.parse(stored);
        if (stored.version !== expectedVersion) {
          stored = null;
        }
      }
      catch (ex) {
        stored = null;
      }
    }

    return stored;
  }
};

/*
   ####                                      ####   ####
    #  #                                      #  #   #  #
    #  #  # ##    ###    ## #   ###   # ##    #  #   #  #
    #  #  ##  #      #  #  #   #   #  ##  #   #  #   ###
    #  #  #       ####   ##    #   #  #   #   #  #   #  #
    #  #  #      #   #  #      #   #  #   #   #  #   #  #
   ####   #       ####   ###    ###   #   #  ####   ####
                        #   #
                         ###
*/
org.ellab.dragonstory.DragonDBItem = function(id, breed, mydragon, egg) {
  this.id = id;
  this.breed = breed;
  this.mydragon = mydragon;
  this.egg = egg;
};

org.ellab.dragonstory.DragonDBItem.prototype.dragonid = function() {
  return this.id;
};

org.ellab.dragonstory.DragonDBItem.prototype.name = function() {
  return this.breed?this.breed.name:'';
};

org.ellab.dragonstory.DragonDBItem.prototype.wikiaURL = function() {
  return this.breed && this.breed.name?'http://dragon-story.wikia.com/wiki/' + this.breed.name.replace(/\s/g, '_') + '_Dragon':'';
};

org.ellab.dragonstory.DragonDBItem.prototype.nameWithURL = function() {
  return this.breed && this.breed.name?
    '<a href="http://dragon-story.wikia.com/wiki/' + this.breed.name.replace(/\s/g, '_') + '_Dragon" target="_blank">' + this.breed.name + '</a>'
    :'';
};

org.ellab.dragonstory.DragonDBItem.prototype.rarity = function() {
  return this.breed?this.breed.rarity:null;
};

org.ellab.dragonstory.DragonDBItem.prototype.env = function() {
  return this.breed?this.breed.environments:null;
};

org.ellab.dragonstory.DragonDBItem.prototype.maxlevel = function() {
  return (this.mydragon && this.mydragon.maxlevel)?this.mydragon.maxlevel:0;
};

org.ellab.dragonstory.DragonDBItem.prototype.owned = function() {
  return (this.mydragon && this.mydragon.maxlevel);
};

org.ellab.dragonstory.DragonDBItem.prototype.badgeHTML = function() {
  var rarityColor = ['', '#c09853', '#3a87ad', '#468847', '#468847'];
  if (this.mydragon && this.mydragon.maxlevel) {
    return '<span class="badge" style="margin:0 5px; background-color:' + rarityColor[this.breed.rarity] + ';">' + this.mydragon.maxlevel + '</span>';
  }
  else {
    return '';
  }
};

org.ellab.dragonstory.DragonDB = function() {
  this.reindex();
  this.eggs = {};
};

org.ellab.dragonstory.DragonDB.prototype.reindex = function() {
  this.nameToIdIdx = {};
  this.types = {};
  this.incubation = {};
  this.envs = {};
  this.rarities = {};

  var savedThis = this;

  if (typeof type_image_url !== 'undefined') {
    // to sort the type
    var typeArray = [];
    for (var type in type_image_url) {
      typeArray.push(type);
    }
    typeArray.sort();

    for (var i=0 ; i<typeArray.length ; i++) {
      var typeArrayItem = typeArray[i];
      this.types[typeArrayItem] = { type:typeArrayItem, name:ds.capitalize(typeArrayItem), img: type_image_url[typeArrayItem], count:0, dragonids:[] };
    }
  }

  if (typeof breeds !== 'undefined') {
    for (var dragonid in breeds) {
      var dragon = breeds[dragonid];

      this.nameToIdIdx[dragon.name] = dragonid;

      /*jshint loopfunc:true */
      (dragon.types || []).forEach(function(type) {
        if (savedThis.types[type]) {
          savedThis.types[type].count++;
          savedThis.types[type].dragonids.push(dragonid);
        }
      });
      /*jshint loopfunc:false */

      // incubation
      var incubationSeconds = ds.getIncubationSeconds(dragon.incubation);
      var incubation = this.incubation[incubationSeconds];
      if (typeof incubation === 'undefined') {
        this.incubation[incubationSeconds] = incubation = [];
      }
      incubation.push(dragonid);

      // rarities
      if (!this.rarities[dragon.rarity]) {
        this.rarities[dragon.rarity] = { rarity:dragon.rarity, name:ds.getRarityDesc(dragon.rarity), count:0, dragonids:[] };
      }
      this.rarities[dragon.rarity].dragonids.push(dragonid);
      this.rarities[dragon.rarity].count++;

      // environments
      /*jshint loopfunc:true */
      (dragon.environments || []).forEach(function(env) {
        if (!this.envs[env]) {
          this.envs[env] = { env:env, name:ds.capitalize(env.replace(/_/g, ' ')), count:0, dragonids:[] };
        }
        this.envs[env].dragonids.push(dragonid);
        this.envs[env].count++;
      }, this);
      /*jshint loopfunc:false */
    }
  }
};

org.ellab.dragonstory.DragonDB.prototype.setMyDragon = function(mydragon) {
  g_mydragon.set(mydragon);
};

org.ellab.dragonstory.DragonDB.prototype.setEggs = function(eggs) {
  this.eggs = eggs || {};
};

org.ellab.dragonstory.DragonDB.prototype.byName = function(name) {
  if (!name) {
    return null;
  }

  var dragonid = this.nameToIdIdx[name];
  if (dragonid) {
    return new ds.DragonDBItem(dragonid, breeds[dragonid], g_mydragon.byID(dragonid), this.eggs[name + ' Dragon']);
  }
  else {
    return null;
  }
};

org.ellab.dragonstory.DragonDB.prototype.byID = function(dragonid) {
  if (!dragonid) {
    return null;
  }

  if (dragonid && typeof breeds !== 'undefined') {
    if (breeds[dragonid]) {
      return new ds.DragonDBItem(dragonid, breeds[dragonid], g_mydragon?g_mydragon.byID(dragonid):null, this.eggs[breeds[dragonid].name + ' Dragon']);
    }
    else {
      // for some reason mydragon has the dragon but breeds does not
      return null;
    }
  }
  else {
    return null;
  }
};

/*
   #   #         ####
   #   #          #  #
   ## ##  #   #   #  #  # ##    ###    ## #   ###   # ##
   # # #  #   #   #  #  ##  #      #  #  #   #   #  ##  #
   #   #  #  ##   #  #  #       ####   ##    #   #  #   #
   #   #   ## #   #  #  #      #   #  #      #   #  #   #
   #   #      #  ####   #       ####   ###    ###   #   #
          #   #                       #   #
           ###                         ###
*/
org.ellab.dragonstory.MyDragonItem = function(dragonid, levels) {
  this.dragonid = dragonid;
  this.levels = levels;
  this.maxlevel = 0;

  for (var i=10 ; i>=1 ; i--) {
    if (this.levels & (1 << (i-1))) {
      this.maxlevel = i;
      break;
    }
  }
};

org.ellab.dragonstory.MyDragon = function(json) {
  this.KEY = 'mydragon';
  this._dragons = {}; // MyDragonItem
  this._mydragon = {};
  this.json = '';

  if (json) {
    // from input, throw exception if parse fail
    this._mydragon  = JSON.parse(json);
    this.json = this._mydragon?JSON.stringify(this._mydragon):'';
    this.onChange();
  }
  else {
    var stored = ds.StorageManager.getVersionedData(this.KEY, MYDRAGON_DATA_VERSION);
    this._mydragon = stored?stored.mydragon:null;
    this.json = this._mydragon?JSON.stringify(this._mydragon):'';
    this.onChange();
  }
};

org.ellab.dragonstory.MyDragon.prototype.set = function(dragons) {
  var json = '';
  var mydragon = null;
  if (typeof dragons === 'string') {
    try {
      mydragon = JSON.parse(dragons);
      json = dragons;
    }
    catch (err) {
      return false;
    }
  }
  else {
    mydragon = dragons;
    json = JSON.stringify(dragons);
  }

  this._mydragon = mydragon;
  this.json = json;

  if (localStorage) {
    localStorage.setItem('ellab-dragonstory-' + this.KEY, JSON.stringify({ version: MYDRAGON_DATA_VERSION, mydragon: mydragon, updateTime: new Date() }));
  }

  this.onChange();

  return true;
};

org.ellab.dragonstory.MyDragon.prototype.onChange = function() {
  this.score = 0;
  this.totalDragonScore = 0;
  this.dragons = {};
  this.dragonCount = 0;
  this.epicDragonCount = 0;
  this.dragonCountHTML = '';
  this.dragonCountMoreHTML = '';

  var envDragonCount = {};
  var envEpicDragonCount = {};
  var rarityDragonCount = {};
  var rarityEpicDragonCount = {};

  var rarityHTML = '';

  if (this._mydragon && Object.keys(this._mydragon).length > 0) {
    for (var dragonid in this._mydragon) {
      var dragonItem = new ds.MyDragonItem(dragonid, this._mydragon[dragonid]);
      this.dragons[dragonid] = dragonItem;
      this.dragonCount += dragonItem.maxlevel?1:0;
      this.epicDragonCount += dragonItem.maxlevel === 10?1:0;

      var dragon = g_db.byID(dragonid);

      // for some reason mydragon has the dragon but breeds does not
      if (!dragon) {
        continue;
      }

      // score
      this.score += ds.calcDragonScore(dragon.rarity(), dragonItem.maxlevel);

      // environment
      /*jshint loopfunc:true*/
      ((dragon && dragon.env()) || []).forEach(function(env) {
        if (dragonItem.maxlevel) {
          envDragonCount[env] = (envDragonCount[env] || 0) + 1;
        }
        if (dragonItem.maxlevel === 10) {
          envEpicDragonCount[env] = (envEpicDragonCount[env] || 0) + 1;
        }
      }, this);
      /*jshint loopfunc:false*/

      // rarity
      rarityDragonCount[dragon.rarity()] = (rarityDragonCount[dragon.rarity()] || 0) + 1;
      rarityEpicDragonCount[dragon.rarity()] = (rarityEpicDragonCount[dragon.rarity()] || 0) + (dragonItem.maxlevel === 10?1:0);
    }

    // construct the rarity stat HTML and score HTML
    for (var rarity=1 ; rarity<=4 ; rarity++) {
      rarityHTML += (rarityHTML?'<br/>':'') +
                    '<span class="dragon-rarity">' + ds.getRarityDesc(rarity) + '</span> - Total: <b>' +
                      (rarityDragonCount[rarity] || 0) + '</b> / <b>' + g_db.rarities[rarity].dragonids.length + '</b> (' +
                      Math.round((rarityDragonCount[rarity] || 0) / g_db.rarities[rarity].dragonids.length * 100, 0) + '%)' +
                    (rarityEpicDragonCount[rarity]?', Epic: <b>' + rarityEpicDragonCount[rarity] + '</b> / <b>' +
                      rarityDragonCount[rarity] + '</b> (' +
                      Math.round(rarityEpicDragonCount[rarity] / rarityDragonCount[rarity] * 100, 0) + '%)'
                    :'');

      this.totalDragonScore += g_db.rarities[rarity].dragonids.length * ds.calcDragonScore(rarity, 10);
    }

    for (var env in envDragonCount) {
      this.dragonCountMoreHTML += (this.dragonCountMoreHTML?'; ':'') +
                                  ds.capitalize(env.replace(/_/g, ' ')) + ' - Total: <b>' + (envDragonCount[env] || 0) + '</b>' +
                                  (envEpicDragonCount[env]?', Epic: <b>' + envEpicDragonCount[env] + '</b>':'');
    }

    if (rarityHTML) {
      this.dragonCountMoreHTML += (this.dragonCountMoreHTML?'<br/>':'') + rarityHTML;
    }
  }

  this.dragonCountHTML = 'You have <b>' + this.dragonCount + '</b> Dragon' + (this.dragonCount > 1?'s':'');
  if (this.epicDragonCount > 1) {
    this.dragonCountHTML += ', <b>' + this.epicDragonCount + '</b> are Epic Dragons.';
  }
  else if (this.epicDragonCount === 1) {
    this.dragonCountHTML += ', with <b>1</b> Epic Dragon.';
  }
  else {
    this.dragonCountHTML += '.';
  }
};

org.ellab.dragonstory.MyDragon.prototype.byID = function(dragonid) {
  return this.dragons[dragonid] || new ds.MyDragonItem('notfound', 0);
};

org.ellab.dragonstory.MyDragon.prototype.hasLevel = function(dragonSetting, level) {
  return (dragonSetting & (1 << (level-1)))?true:false;
};

/*
   ####                            #         #####         #
    #  #                           #           #           #
    #  #  # ##    ###    ###    ## #           #     ###   # ##
    ###   ##  #  #   #  #   #  #  ##           #        #  ##  #
    #  #  #      #####  #####  #   #           #     ####  #   #
    #  #  #      #      #      #  ##           #    #   #  ##  #
   ####   #       ###    ###    ## #           #     ####  # ##
*/
org.ellab.dragonstory.onBreedResponse = function(e, html) {
  if (!html) {
    return;
  }

  // split tbody and thead
  html = html.replace(/<tbody>/g, '<thead>');
  html = html.replace(/<\/th><\/tr>/g, '</th></tr></thead><tbody>');

  // remove inline style
  html = html.replace(/\s*style="[^"]*"+s*/g, '');

  // add target="_blank" to all links
  html = html.replace(/<a /g, '<a target="_blank" ');

  // re-style table and remove all inline style
  $('#breed-result').html(html)
    .find('table')
      .addClass("table table-striped table-condensed table-bordered");

  if (g_mydragon.dragonCount > 0) {
    // add badge
    $('#breed-result tbody tr td:first-child a').each(function() {
      var dragon = g_db.byName(this.getAttribute('title').replace(/\s+Dragon$/, ''));
      if (dragon.owned()) {
        $(dragon.badgeHTML()).insertAfter(this);
      }
    });

    // highlight breeding result that is not owned
    $('#breed-result tbody tr + tr').filter(function() {
      return this.cells[0].innerHTML.indexOf('badge') === -1;
    }).addClass('success');
  }

  if ($('#breed-result tr').length <= 4) {
    // hide the filter if only 3 result or less
    $('#breedtab [data-role="result-filter"]').hide();
  }
  else {
    $('#breedtab [data-role="result-filter"]').show();

    // only show the types in result table
    $('#breedtab [data-role="result-filter"] [data-role="dragon-type-btn-group"] label').show().filter(function() {
      var typeimg = type_image_url[$(this).find(':radio').val()];
      return (typeimg && html.indexOf(typeimg) === -1);
    }).hide();

    // only show the time in result table
    $('#breedtab [data-role="result-filter"] [data-role="dragon-incubation-btn-group"] label').hide();
    $('#breedtab [data-role="result-filter"] [data-role="dragon-incubation-btn-group"] label').first().show();
    $('#breed-result tbody tr').each(function() {
      var dragonIncubation = parseInt(this.cells[3].textContent, 10) * (this.cells[4].textContent.replace(/\s*/g, '') === 'seconds'?1:3600);
      if (!isNaN(dragonIncubation)) {
        if (dragonIncubation <= 3600) {
          $('#breedtab [data-role="result-filter"] [data-role="dragon-incubation-btn-group"] :radio[value="<7200"]').closest('label').show();
        }
        else {
          $('#breedtab [data-role="result-filter"] [data-role="dragon-incubation-btn-group"] :radio[value="' + dragonIncubation + '"]').closest('label').show();
        }
      }
    });
  }
};

/*
   ####                                #            #####         #
   #   #                               #              #           #
   #   #   ###   # ##    ###   # ##   ####            #     ###   # ##
   ####       #  ##  #  #   #  ##  #   #              #        #  ##  #
   #       ####  #      #####  #   #   #              #     ####  #   #
   #      #   #  #      #      #   #   #  #           #    #   #  ##  #
   #       ####  #       ###   #   #    ##            #     ####  # ##
*/
org.ellab.dragonstory.onParentResponse = function(e, html) {
  if (!html) {
    return;
  }

  // split tbody and thead
  html = html.replace(/<tbody>/g, '<thead>');
  html = html.replace(/<\/th><\/tr>/g, '</th></tr></thead><tbody>');

  // add target="_blank" to all links
  html = html.replace(/<a /g, '<a target="_blank" ');

  // remove inline style
  html = html.replace(/\s*style="[^"]*"+s*/g, '');

  // add the <span/> to wrap the text for further processing, only wrap </a>xxx<zzz>
  html = html.replace(/<\/a>\s*([^<]+)\s*(<[^\/])/g, '</a><span>$1</span>$2');

  // re-style table and remove all inline style
  $('#parent-result').html(html)
    .find('table')
      .addClass("table table-striped table-condensed table-bordered");

  if (g_mydragon.dragonCount > 0) {
    // if didn't set my dragon, don't do filtering and no need to show filter
    $('#parenttab [data-role="result-filter"]').show();

    // check mydragon
    $('#parent-result table tbody tr').each(function() {
      var $cell0 = $(this.cells[0]);
      var $cell3 = $(this.cells[3]);

      [$cell0, $cell3].forEach(function(item, cellidx) {
        var firstOwnedDragon = true;

        item.find('a').each(function() {
          var dragon = g_db.byName(this.getAttribute('title').replace(/\s+Dragon$/, ''));

          if (dragon.owned()) {
            $(dragon.badgeHTML()).insertAfter(this);

            if (firstOwnedDragon) {
              firstOwnedDragon = false;

              // hide the previous "," or ", or" since previous dragons are all hidden
              if (this.previousSibling) {
                this.previousSibling.setAttribute('data-not-owned-dragon', true);
                this.previousSibling.style.display = 'none';
              }
            }
          }
          else {
            // remove previous
            if (this.previousSibling) {
                this.previousSibling.setAttribute('data-not-owned-dragon', true);
                this.previousSibling.style.display = 'none';
            }
            this.setAttribute('data-not-owned-dragon', true);
            this.style.display = 'none';
          }
        });
      });

      if ($cell0.find('.badge').length && ($cell3.length === 0 || $cell3.find('.badge').length)) {
        // $cell3.length === 0 means it is the first table (i.e. can be breed using one of the following ... )
      }
      else {
        this.setAttribute('data-not-owned-dragon', true);
        this.style.display = 'none';
      }
    });
  }

  // insert the 'breed' button column
  // there can be 3 tables (e.g. choose Goblin)
  // only add the breed button in last type (i.e. 4 columns table)
  // - The xxx Dragon can be bred by pairing one of the following n dragons with any dragon that provides at least one different type.
  //   | Dragons | Types |
  // - The xxx Dragon can be bred by pairing one of the following n dragons with any other dragon
  //   | Dragons | Types |
  // - The xxx Dragon can be bred using one of the following n pairs.
  //   | Group A Dragons | Graop A Types | Group B Types | Group B Dragons |
  $('#parent-result table thead tr').each(function() {
    if (this.cells.length === 4) {
      $(this.cells[1]).after('<th>Breed</th>');
    }
  });
  $('#parent-result table tbody tr').each(function() {
    if (this.cells.length === 4) {
      $(this.cells[1]).after('<td><button data-role="do-breed">Breed</button></td>');
    }
  });
};

// Handle the breed btn in parent tab
// find the highest breed priority dragons and call the breed tab to show the breed result
org.ellab.dragonstory.onParentBreedBtn = function() {
  function getDragonToBreed(td) {
    var maxPriority = 0;
    var dragonid = null;
    $(td).find('a').each(function() {
      var dragon = g_db.byName(this.getAttribute('title').replace(/\s+Dragon$/, ''));

      // order by (1) owned > not owned (2) rarity (3) level
      var breedPriority = dragon.rarity() * 100 * (dragon.maxlevel()>0?1:0) + dragon.maxlevel() * 10 + dragon.rarity();
      if (breedPriority > maxPriority) {
        maxPriority = breedPriority;
        dragonid = dragon.dragonid();
      }
    });

    return dragonid;
  }

  var dragon1 = getDragonToBreed($(this).closest('tr')[0].cells[0]);
  var dragon2 = getDragonToBreed($(this).closest('tr')[0].cells[4]);

  if (dragon1 && dragon2) {
    // reset the second dragon list to avoid double breed requests on below select dragon
    ds.resetRadio('#breed-list-2');
    ds.selectDragon('#breed-prefix-list-1', dragon1);
    ds.selectDragon('#breed-prefix-list-2', dragon2);
    $('.nav-tabs a[href=#breedtab][data-toggle="tab"]').click();
    $('html, body').animate({ scrollTop: $('[data-role="result-filter"]').offset().top }, 500);
  }
};

/*
   ####           #      #      ##                  #####         #
    #  #          #      #       #                    #           #
    #  #   ###   ####   ####     #     ###            #     ###   # ##
    ###       #   #      #       #    #   #           #        #  ##  #
    #  #   ####   #      #       #    #####           #     ####  #   #
    #  #  #   #   #  #   #  #    #    #               #    #   #  ##  #
   ####    ####    ##     ##    ###    ###            #     ####  # ##
*/
org.ellab.dragonstory.onBattleResponse = function(e, html) {
  if (!html) {
    return;
  }

  // split tbody and thead
  html = html.replace(/<tbody>/g, '<thead>');
  html = html.replace(/<\/th><\/tr>/g, '</th></tr></thead><tbody>');

  // add target="_blank" to all links
  html = html.replace(/<a /g, '<a target="_blank" ');

  // remove inline style
  html = html.replace(/\s*style="[^"]*"+s*/g, '');

  // hide the 10% cells to reduce the noise
  html = html.replace(/>10%</g, '');

  if (g_mydragon.dragonCount > 0) {
    // add extra 'mydragon chance' column
    html = html.replace(/<\/th>/, '</th><th style="text-align:center;">My</th>');
    html = html.replace(/(<\/a>\s*<\/td>)/g, '$1<td></td>');
  }

  $('#battle-result').html(html)
    .find('table')
      .addClass("table table-striped table-condensed table-bordered")
      .find('tr').filter(function() {
        // level 10 is 10% (i.e. textContent === '', removed in above) means all level is 10%, remove this tr
        // note the if g_mydragon.dragonCount > 0 we already added a column in front of lvl 10
        return this.cells[(g_mydragon.dragonCount>0?2:1)].textContent === '';
      }).remove();

  if (g_mydragon.dragonCount > 0) {
    $('#battle-result tbody tr').each(function() {
      // use dom instead of jquery to improve performance
      // for one particular case (Fairy Dragon, level 10), change from 6xxx ms to 16ms
      var dragon = g_db.byName(this.cells[0].textContent);
      if (dragon.owned()) {
        // add badge
        $(dragon.badgeHTML()).insertAfter($(this.cells[0]).find('a'));

        // highlight the best change cell
        var td = this.cells[(10 - dragon.mydragon.maxlevel + 2)];
        if (td.textContent) {
          td.className += ' success';
          this.cells[1].className += ' warning';
          this.cells[1].innerHTML = td.innerHTML;
        }
        else {
          // owned but only 10% change, hide the row
          this.style.display = 'none';
        }
      }
      else {
        // not own this dragon, hide the row
        this.style.display = 'none';
      }
    });

    // sort table now
    var sortArray = [];
    $('#battle-result tbody tr').each(function(i) {
      sortArray.push({pct:parseInt(this.cells[1].textContent, 10), name:this.cells[0].textContent, tr:this});
    });
    sortArray.sort(function(a, b) {
      var p1 = a.pct || 0;
      var p2 = b.pct || 0;
      if (p1 === p2) {
        return a.name < b.name?-1:1;
      }
      else {
       return p2 - p1;
      }
    });

    var newtbody = document.createElement('TBODY');
    sortArray.forEach(function(ele) {
      newtbody.appendChild(ele.tr);
    });
    $('#battle-result tbody').remove();
    $('#battle-result table').append(newtbody);
  }
};

/*
   #   #             #                                            #####         #
   #   #             #                                              #           #
   ## ##  #   #   ## #  # ##    ###    ## #   ###   # ##            #     ###   # ##
   # # #  #   #  #  ##  ##  #      #  #  #   #   #  ##  #           #        #  ##  #
   #   #  #  ##  #   #  #       ####   ##    #   #  #   #           #     ####  #   #
   #   #   ## #  #  ##  #      #   #  #      #   #  #   #           #    #   #  ##  #
   #   #      #   ## #  #       ####   ###    ###   #   #           #     ####  # ##
          #   #                       #   #
           ###                         ###
*/
org.ellab.dragonstory.buildMyDragon = function(init, containerSelector, dragonCountSelector) {
  function makeSaveString() {
    var saved = {};

    $(containerSelector).find('.selected').each(function() {
      var $this = $(this);
      var level = parseInt($this.data('level'), 10);
      if (level) {
        var dragonid = $this.parent('tr').data('dragonid');
        saved[dragonid] = (saved[dragonid] || 0) + (1 << (level - 1));
      }
    });

    return JSON.stringify(saved);
  }

  function updateDragonScoreProgress() {
    var scorePct = Math.floor(g_mydragon.score / g_mydragon.totalDragonScore * 100, 0) + '%';
    /*jshint multistr:true */
    var html = '<div>Your Game Progress is: <b>' + scorePct + '</b> (' +
               ds.thousandSep(g_mydragon.score) + ' / ' + ds.thousandSep(g_mydragon.totalDragonScore) + ')</div>';
    html += '<hr><div>' + g_mydragon.dragonCountHTML + '<br/>' + g_mydragon.dragonCountMoreHTML + '</div>';
    html += '<hr><div>Game Progress is calculated by:</div>                                               \
             <div style="padding-left: 20px;">Sum of (Rarity x Highest Level) or your dragons.  Where Rarity is, </div>   \
             <div style="padding-left: 40px;">                                                            \
             <table border="0"><tr><td><span class="dragon-rarity">Common</span>: </td><td>1</td></tr>    \
             <tr><td><span class="dragon-rarity">Rare</span>: </td><td>3</td></tr>                        \
             <tr><td><span class="dragon-rarity">Super Rare</span>: </td><td>6</td></tr>                  \
             <tr><td><span class="dragon-rarity">Ultra Rare</span>: </td><td>10</td></tr>                 \
             </table></div>';
    /*jshint multistr:false */

    $('#dragon-score-progress .progress-bar').css({ 'width': scorePct }).html(scorePct);
    $('#dragon-score-progress').attr('data-content', html);
  }

  var tbodyHTML = '';
  var theadHTML = '';
  var dragonCount = 0;
  var epicDragonCount = 0;

  for (var dragonid in breeds) {
    var dragon = g_db.byID(dragonid);
    var breed = dragon.breed;
    tbodyHTML += '<tr data-dragonid="' + dragonid + '" data-dragonname="' + breed.name + '"><td>' + dragon.nameWithURL() + dragon.badgeHTML() +
                 '</td><td>' + ds.getTypeHTML(breed.types, 16) +
                 '</td><td data-sort-value="' + breed.rarity + '">' + ds.getRarityDesc(breed.rarity) +
                 '</td><td data-sort-value="' + ds.getIncubationSeconds(breed.incubation) + '">' + ds.getIncubationText(breed.incubation) +
                 '</td>';

    for (var i=0 ; i<=10 ; i++) {
      tbodyHTML += '<td data-level="' + i + '"' + (dragon.mydragon.maxlevel === i?' class="selected"':'') + '>' + (i>0?i:'') + '</td>';
    }

    tbodyHTML += '</tr>';
  }

  theadHTML = '<th>Dragon</th><th>Types</th><th>Rarity</th><th>Incubation</th>';
  for (var thi=0 ; thi<=10 ; thi++) {
    theadHTML += '<th>' + thi + '</th>';
  }

  var html = '<table class="table table-striped table-condensed table-bordered tablesorter-blue tablesorter-bootstrap">' +
             '<thead><tr>' + theadHTML + '</tr></thead><tbody>' + tbodyHTML + '</tbody></table>';
  theadHTML = null;
  tbodyHTML = null;

  $(containerSelector).html(html).find('table').tablesorter({
    theme: 'bootstrap',
    textExtraction: {
      2: function(node, table, cellIndex) { return parseInt(node.getAttribute('data-sort-value'), 10); },
      3: function(node, table, cellIndex) { return parseInt(node.getAttribute('data-sort-value'), 10); }
    }
  });

  if (dragonCountSelector) {
    $(dragonCountSelector).html(g_mydragon.dragonCountHTML);
  }
  updateDragonScoreProgress();

  if (init) {
    // only bind click event in first time
    $(containerSelector).on('click', '.tablesorter tr td:nth-child(n+5)', function() {
      var $this = $(this);

      $this.siblings('[data-level].selected').removeClass('selected');
      $this.toggleClass('selected');
      if (!$this.hasClass('selected')) {
        // none selected
        $this.parent().find('[data-level="0"]').addClass('selected');
      }

      g_mydragon.set(makeSaveString());
      if (dragonCountSelector) {
        $(dragonCountSelector).html(g_mydragon.dragonCountHTML);
      }
      updateDragonScoreProgress();

      var $tr = $this.parent();
      $tr.find('td:first-child span.badge').remove();
      $tr.find('td:first-child').append(g_db.byID($tr.data('dragonid')).badgeHTML());
    });
  }
};

org.ellab.dragonstory.onMyDragonPrefixChange = function(e) {
  $(this).prop('checked', true);  // fix the bug in bootstrap that click checked radio will uncheck but fire change event
  var prefix = $(this).closest('.btn-group').find(':checked').val();
  if (prefix) {
    $('#mydragon-result tbody tr').each(function() {
      var $this = $(this);
      var dragonName = $this.attr('data-dragonname');
      if (dragonName && dragonName.length > 0 && (prefix === '*' || dragonName.charAt(0).toUpperCase() === prefix.toUpperCase())) {
        $this.show();
      }
      else {
        $this.hide();
      }
    });
  }
};

org.ellab.dragonstory.onMyDragonSelectDragon = function(e, dragonid) {
  $('.tab-content .tab-pane.active #mydragon-result tbody tr[data-dragonid=' + dragonid + ']').show();
  $('.tab-content .tab-pane.active #mydragon-result tbody tr[data-dragonid!=' + dragonid + ']').hide();
};

/*
   ####                                          #  #             #####         #
    #  #                                         #  #               #           #
    #  #  # ##    ###    ## #   ###   # ##    ## #  # ##            #     ###   # ##
    #  #  ##  #      #  #  #   #   #  ##  #  #  ##  ##  #           #        #  ##  #
    #  #  #       ####   ##    #   #  #   #  #   #  #   #           #     ####  #   #
    #  #  #      #   #  #      #   #  #   #  #  ##  ##  #           #    #   #  ##  #
   ####   #       ####   ###    ###   #   #   ## #  # ##            #     ####  # ##
                        #   #
                         ###
*/
org.ellab.dragonstory.buildDragonDB = function(containerSelector) {
  if (typeof breeds === 'undefined') {
    return;
  }

  var tbodyHTML = '';
  var theadHTML = '';
  var dragonCount = 0;
  var epicDragonCount = 0;

  for (var dragonid in breeds) {
    var dragon = g_db.byID(dragonid);
    tbodyHTML += '<tr data-dragonid="' + dragonid + '" data-dragonname="' + dragon.breed.name +
                 '" data-dragontype="' + dragon.breed.types.join(',') + '" data-dragonincubation="' +
                 ds.getIncubationSeconds(dragon.breed.incubation) + '"><td>' + dragon.nameWithURL() + dragon.badgeHTML() +
                 '</td><td>' + ((dragon.egg && dragon.egg.eggimg)?'<img src="' + dragon.egg.eggimg + '"/>':'') +
                 '</td><td>' + ds.getTypeHTML(dragon.breed.types) +
                 '</td><td data-sort-value="' + dragon.breed.rarity + '">' + ds.getRarityDesc(dragon.breed.rarity) +
                 '</td><td data-sort-value="' + ds.getIncubationSeconds(dragon.breed.incubation) + '">' + ds.getIncubationText(dragon.breed.incubation) +
                 '</td>';

    tbodyHTML += '</tr>';
  }

  theadHTML = '<th>Dragon</th><th>Egg</th><th>Types</th><th>Rarity</th><th>Incubation</th>';

  var html = '<table class="table table-striped table-condensed table-bordered tablesorter-blue tablesorter-bootstrap">' +
             '<thead><tr>' + theadHTML + '</tr></thead><tbody>' + tbodyHTML + '</tbody></table>';
  theadHTML = null;
  tbodyHTML = null;

  $(containerSelector).html(html).find('table').tablesorter({
    theme: 'bootstrap',
    textExtraction: {
      1: function(node, table, cellIndex) { return node.previousSibling.innerHTML; },
      2: function(node, table, cellIndex) { return node.previousSibling.previousSibling.innerHTML; },
      3: function(node, table, cellIndex) { return parseInt(node.getAttribute('data-sort-value'), 10); },
      4: function(node, table, cellIndex) { return parseInt(node.getAttribute('data-sort-value'), 10); }
    }
  });
};

org.ellab.dragonstory.onDragonDBChange = function(target) {
  var targetName = target.getAttribute('name');
  if (targetName !== 'dragondbprefix') {
    ds.resetRadio('#dragondbtab [data-role="dragon-prefix-btn-group"]', true);
  }
  if (targetName !== 'dragondbtype') {
    ds.resetRadio('#dragondbtab [data-role="dragon-type-btn-group"]', true);
  }
  if (targetName !== 'dragondbincubation') {
    ds.resetRadio('#dragondbtab [data-role="dragon-incubation-btn-group"]', true);
  }

  var prefix = $('#dragondbtab [data-role="dragon-prefix-btn-group"] :checked').val();
  var type = $('#dragondbtab [data-role="dragon-type-btn-group"] :checked').val();
  var incubation = ds.getIncubationBtnSelectedRange('#dragondbtab [data-role="dragon-incubation-btn-group"]');

  if (prefix || type || incubation) {
    $('#dragondb-result tbody tr').each(function() {
      var $this = $(this);

      var dragonName = $this.data('dragonname') + '';  // "Infinity" will become number
      var dragonType = $this.data('dragontype');
      var dragonIncubation = $this.data('dragonincubation');

      var nameMatch = dragonName && dragonName.length > 0 &&
                      (!prefix || prefix === '*' || dragonName.charAt(0).toUpperCase() === prefix.toUpperCase());
      var typeMatch = dragonType && dragonType.length > 0 &&
                      (!type || type === '*' || $.inArray(type, dragonType.split(',')) !== -1);
      var incubationMatch = dragonIncubation && dragonIncubation > 0 &&
                            (!incubation || (dragonIncubation >= incubation.from && dragonIncubation < incubation.to));

      if (nameMatch && typeMatch && incubationMatch) {
        $this.show();
      }
      else {
        $this.hide();
      }
    });
  }
};

})();
