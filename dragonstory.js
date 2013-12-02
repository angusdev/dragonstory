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
    return s.charAt(0).toUpperCase() + s.substring(1);
  }
  else {
    return s;
  }
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
  });
  for (var i=0 ; i<26 ; i++) {
    var val = String.fromCharCode(65 + i);
    $btngroup.append('<label class="btn btn-default"><input type="radio" name="' + $btngroup.data('radio-name') + '" value="' + val + '">' + val  + '</label>');
  }

  // select the all button
  $btngroup.find(':radio[value="*"]').prop('checked', true);

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

  return $btngroup;
};

org.ellab.dragonstory.selectDragon = function(btngroup, dragonid) {
  ds.selectPrefix(btngroup, dragonid);
  $($(btngroup).data('for')).find(':radio[value="' + dragonid + '"]').first().click();
};

org.ellab.dragonstory.selectPrefix = function(btngroup, dragonid) {
  $(btngroup).find(':radio[value="' + g_db.byID(dragonid).breed.name.charAt(0).toUpperCase() + '"]').first().click();
};

org.ellab.dragonstory.resetRadio = function(selector, selectFirst) {
  $(selector).find('label').each(function() {
    $(this).removeClass('active').find(':radio').prop('checked', false);
  });
  if (selectFirst) {
    $(selector).find('label').first().addClass('active').find(':radio').prop('checked', true);
  }
};

org.ellab.dragonstory.makeLevelBtn = function() {
  var $btngroup = $('[data-role="dragon-level-btn-group"]');
  for (var i=1 ; i<=20; i++) {
    $btngroup.append('<label class="btn btn-default' + (i===20?' active':'') + '"><input type="radio" name="' + $btngroup.data('radio-name') + '" value="' + i + '">' + i + '</label>');
  }
  $btngroup.find(':radio[value=20]').prop('checked', true);
};

org.ellab.dragonstory.makeTypeBtn = function() {
  var $btngroup = $('[data-role="dragon-type-btn-group"]');
  $btngroup.each(function() {
    var $this = $(this);

    var hasall = $this.data('hasall');
    if (hasall) {
      $this.append('<label class="btn btn-default' + (hasall==='selected'?' active':'') + '"><input type="radio" name="' + $btngroup.data('radio-name') + '" value="*">All</label>');
    }
    for (var type in g_db.types) {
      $this.append('<label class="btn btn-default"><input type="radio" name="' + $btngroup.data('radio-name') + '" value="' + type + '">' +
                   '<img src="' + g_db.types[type].img + '" width="16"/></label>');
    }
    if (hasall === 'selected') {
      $this.find(':radio[value="*"]').prop('checked', true);
    }
  });
};

org.ellab.dragonstory.makeIncubationBtn = function() {
  var $btngroup = $('[data-role="dragon-incubation-btn-group"]');
  $btngroup.each(function() {
    var $this = $(this);

    var hasall = $this.data('hasall');
    if (hasall) {
      $this.append('<label class="btn btn-default' + (hasall==='selected'?' active':'') + '"><input type="radio" name="' + $btngroup.data('radio-name') + '" value="*">All</label>');
    }

    var minhour = $this.data('min-hour');
    if (minhour) {
      // minhour === 1, value = '<7200'
      $this.append('<label class="btn btn-default"><input type="radio" name="' + $btngroup.data('radio-name') + '" value="<' + ((minhour + 1) * 3600) + '">&lt;= ' + minhour + '</label>');
    }
    for (var incubation in g_db.incubation) {
      if (!minhour || incubation > minhour * 3600) {
        $this.append('<label class="btn btn-default"><input type="radio" name="' + $btngroup.data('radio-name') + '" value="' + incubation + '">' +
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
        stored.updateTime = new Date();
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
        stored.updateTime = new Date();
        if (localStorage) {
          localStorage.setItem('ellab-dragonstory-battle', JSON.stringify(stored));
        }

        deferred.resolve(data);
      }
    });
  }

  return deferred;
};

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

org.ellab.dragonstory.clearStoredEggData = function() {
  if (localStorage) {
    localStorage.removeItem('ellab-dragonstory-egg');
  }
};

org.ellab.dragonstory.getStoredEggData = function() {
  var stored = localStorage?localStorage.getItem('ellab-dragonstory-egg'):null;
  if (stored) {
    try {
      stored = JSON.parse(stored);
      if (stored.version !== EGG_DATA_VERSION) {
        stored = null;
      }
    }
    catch (ex) {
      stored = null;
    }
  }

  return stored;
};

org.ellab.dragonstory.loadEggData = function () {
  var deferred = $.Deferred();

  var stored = this.getStoredEggData();
  if (stored) {
    window.setTimeout(function() {
      deferred.resolve(stored.data);
    }, 0);
  }
  else {
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

        deferred.resolve(data);
      }
    });
  }

  return deferred;
};

org.ellab.dragonstory.StorageManager = {
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
    return localStorage?localStorage.getItem('ellab-dragonstory-' + key):null;
  },

  removeItem: function(key) {
    if (localStorage) {
      localStorage.removeItem('ellab-dragonstory-' + key);
    }
  },

  // empty all dragonstory storage
  removeTotal: function(key) {
    if (localStorage) {
      for (var i=0 ; i<this.settings.length ; i++) {
        localStorage.removeItem('ellab-dragonstory-' + this.settings[i]);
      }
    }
  },

  // empty the entire localStorage
  removeAll: function(key) {
    if (localStorage) {
      localStorage.clear();
    }
  }
};

org.ellab.dragonstory.DragonDBItem = function(id, breed, mydragon, egg) {
  this.id = id;
  this.breed = breed;
  this.mydragon = mydragon;
  this.egg = egg;
};

org.ellab.dragonstory.DragonDBItem.prototype.id = function() {
  return this.id;
};

org.ellab.dragonstory.DragonDBItem.prototype.name = function() {
  return this.breed?this.breed.name:'';
};

org.ellab.dragonstory.DragonDBItem.prototype.rarity = function() {
  return this.breed?this.breed.rarity:null;
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
      this.types[typeArrayItem] = { name: ds.capitalize(typeArrayItem), img: type_image_url[typeArrayItem], count:0, dragonids:[] };
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

      var incubationSeconds = ds.getIncubationSeconds(dragon.incubation);
      var incubation = this.incubation[incubationSeconds];
      if (typeof incubation === 'undefined') {
        this.incubation[incubationSeconds] = incubation = [];
      }
      incubation.push(dragonid);
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

  if (dragonid) {
    return new ds.DragonDBItem(dragonid, breeds[dragonid], g_mydragon.byID(dragonid), this.eggs[breeds[dragonid].name + ' Dragon']);
  }
  else {
    return null;
  }
};

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
  this.KEY = 'ellab-dragonstory-mydragon';
  this._dragons = {}; // MyDragonItem
  this._mydragon = {};
  this.json = '';
  this.dragonCount = 0;
  this.epicDragonCount = 0;
  this.dragonCountHTML = '';

  if (json) {
    // from input, throw exception if parse fail
    this._mydragon  = JSON.parse(json);
    this.json = this._mydragon?JSON.stringify(this._mydragon):'';
    this.onChange();
  }
  else {
    // read from localStorage
    var stored = localStorage?localStorage.getItem(this.KEY):null;
    if (stored) {
      try {
        stored = JSON.parse(stored);
        if (stored.version !== MYDRAGON_DATA_VERSION) {
          stored = null;
        }
      }
      catch (ex) {
        stored = null;
      }
    }

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
    localStorage.setItem(this.KEY, JSON.stringify({ version: MYDRAGON_DATA_VERSION, mydragon: mydragon, updateTime: new Date() }));
  }

  this.onChange();

  return true;
};

org.ellab.dragonstory.MyDragon.prototype.onChange = function() {
  this.dragons = {};
  this.dragonCount = 0;
  this.epicDragonCount = 0;

  if (this._mydragon) {
    for (var dragonid in this._mydragon) {
      var dragon = new ds.MyDragonItem(dragonid, this._mydragon[dragonid]);
      this.dragons[dragonid] = dragon;
      this.dragonCount += dragon.maxlevel?1:0;
      this.epicDragonCount += dragon.maxlevel === 10?1:0;
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

org.ellab.dragonstory.onBreedResponse = function(e, html) {
  if (!html) {
    return;
  }

  // split tbody and thead
  html = html.replace('<tbody>', '<thead>');
  html = html.replace('</th></tr>', '</th></tr></thead><tbody>');

  // re-style table and remove all inline style
  $('#breed-result').html(html)
    .find('table')
      .attr('style', '')
      .addClass("table table-striped table-condensed table-bordered")
      .find('th')
        .attr('style', 'text-align:center;');

  // add badge
  $('#breed-result tbody tr td:first-child a').each(function() {
    var dragon = g_db.byName(this.getAttribute('title').replace(/\s+Dragon$/, ''));
    if (dragon.owned()) {
      $(dragon.badgeHTML()).insertAfter(this);
    }
  });

  // highlight breeding result that is not owned
  $('#breed-result tbody tr').filter(function() {
    return this.cells[0].innerHTML.indexOf('badge') === -1;
  }).addClass('success');

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

org.ellab.dragonstory.onParentResponse = function(e, html) {
  if (!html) {
    return;
  }

  // split tbody and thead
  html = html.replace('<tbody>', '<thead>');
  html = html.replace('</th></tr>', '</th></tr></thead><tbody>');

  // add the <span/> to wrap the text for further processing, only wrap </a>xxx<zzz>
  html = html.replace(/<\/a>\s*([^<]+)\s*(<[^/])/g, '</a><span>$1</span>$2');

  // re-style table and remove all inline style
  $('#parent-result').html(html)
    .find('table')
      .attr('style', '')
      .addClass("table table-striped table-condensed table-bordered")
      .find('th')
        .attr('style', 'text-align:center;');

  $('#parenttab [data-role="result-filter"]').show();

  // check mydragon
  $('#parent-result table tbody tr').each(function() {
    var $cell0 = $(this.cells[0]);
    var $cell3 = $(this.cells[3]);

    [$cell0, $cell3].forEach(function(item) {
      var firstOwnedDragon = true;

      item.find('a').each(function() {
        var dragon = g_db.byName(this.getAttribute('title').replace(/\s+Dragon$/, ''));
        if (dragon.owned()) {
          $(dragon.badgeHTML()).insertAfter(this);
          this.setAttribute('data-parent-index', dragon.rarity() * 100 + dragon.maxlevel());

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

    if ($cell0.find('[data-parent-index]').length && ($cell3.length === 0 || $cell3.find('[data-parent-index]').length)) {
      // $cell3.length === 0 means it is the first table (i.e. can be bred using  one of the following ... )
    }
    else {
      this.setAttribute('data-not-owned-dragon', true);
      this.style.display = 'none';
    }
  });
};

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

  var tbodyHTML = '';
  var theadHTML = '';
  var dragonCount = 0;
  var epicDragonCount = 0;

  for (var dragonid in breeds) {
    var dragon = g_db.byID(dragonid);
    var breed = dragon.breed;
    tbodyHTML += '<tr data-dragonid="' + dragonid + '" data-dragonname="' + breed.name + '"><td>' + breed.name + dragon.badgeHTML() +
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

      var $tr = $this.parent();
      $tr.find('td:first-child span.badge').remove();
      $tr.find('td:first-child').append(g_db.byID($tr.data('dragonid')).badgeHTML());
    });
  }
};

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
                 ds.getIncubationSeconds(dragon.breed.incubation) + '"><td>' + dragon.breed.name + dragon.badgeHTML() +
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

})();
