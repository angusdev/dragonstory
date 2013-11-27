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

org.ellab.dragonstory.getIncubationText = function(incubationText) {
  return incubationText.split('_').reverse().slice(1).reverse().join(' ');
};

org.ellab.dragonstory.getIncubationSeconds = function(incubationText) {
  var splitted = incubationText.split('_');
  return parseInt(splitted[0], 10) * (splitted[1]==='seconds'?1:3600);
};

org.ellab.dragonstory.clearDragonBtn = function() {
  $('[data-role="dragon-prefix-btn-group"]').empty();
  $('[data-role="dragon-name-btn-group"]').empty();
  $('[data-role="dragon-level-btn-group"]').empty();
  $('[data-role="dragon-type-btn-group"]').empty();
};

org.ellab.dragonstory.makeDragonBtn = function() {
  var $btngroup = $('[data-role="dragon-prefix-btn-group"]');

  // add "All" button
  $btngroup.each(function() {
    var $this = $(this);
    if ($this.data('hasall') || $this.data('hasallselected')) {
      $this.append('<label class="btn btn-default' + ($this.data('hasallselected')?' active':'') + '"><input type="radio" name="' +
                   $btngroup.data('radio-name') + '" value="*">All</label>');
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

org.ellab.dragonstory.selectDragon = function(btngroup, dragonid, dragonname) {
  var $btngroup = $(btngroup);
  $btngroup.find(':radio[value="' + dragonname.charAt().toUpperCase() + '"]').first().click();
  $($btngroup.data('for')).find(':radio[value="' + dragonid + '"]').first().click();
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
  $btngroup.append('<label class="btn btn-default"><input type="radio" name="' + $btngroup.data('radio-name') + '" value="*">All</label>');
  for (var type in g_db.types) {
    $btngroup.append('<label class="btn btn-default"><input type="radio" name="' + $btngroup.data('radio-name') + '" value="' + type + '">' +
                     '<img src="' + g_db.types[type].img + '" width="16"/></label>');
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
        if (localStorage) {
          localStorage.setItem('ellab-dragonstory-egg', JSON.stringify(stored));
        }

        deferred.resolve(data);
      }
    });
  }

  return deferred;
};

org.ellab.dragonstory.DragonDB = function() {
  this.reindex();
  this.eggs = {};
};

org.ellab.dragonstory.DragonDB.prototype.reindex = function() {
  this.nameToIdIdx = {};
  this.types = {};

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
      this.nameToIdIdx[breeds[dragonid].name] = dragonid;

      /*jshint loopfunc:true */
      (breeds[dragonid].types || []).forEach(function(type) {
        if (savedThis.types[type]) {
          savedThis.types[type].count++;
          savedThis.types[type].dragonids.push(dragonid);
        }
      });
      /*jshint loopfunc:false */
    }
  }
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
    return { breed:breeds[dragonid], mydragon:g_mydragon.mydragon[dragonid], egg:this.eggs[name + ' Dragon'] };
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
    return { breed:breeds[dragonid], mydragon:g_mydragon.mydragon[dragonid], egg:this.eggs[breeds[dragonid].name + ' Dragon'] };
  }
  else {
    return null;
  }
};

org.ellab.dragonstory.MyDragon = function(json) {
  this.KEY = 'ellab-dragonstory-mydragon';
  this.mydragon = {};
  this.json = '';
  this.dragonCount = 0;
  this.epicDragonCount = 0;
  this.dragonCountHTML = '';

  if (json) {
    // from input, throw exception if parse fail
    this.mydragon  = JSON.parse(json);
    this.json = this.mydragon?JSON.stringify(this.mydragon):'';
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

    this.mydragon = stored?stored.mydragon:null;
    this.json = this.mydragon?JSON.stringify(this.mydragon):'';
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

  this.mydragon = mydragon;
  this.json = json;

  if (localStorage) {
    localStorage.setItem(this.KEY, JSON.stringify({ version: MYDRAGON_DATA_VERSION, mydragon: mydragon }));
  }

  this.onChange();

  return true;
};

org.ellab.dragonstory.MyDragon.prototype.onChange = function() {
  this.dragonCount = 0;
  this.epicDragonCount = 0;

  if (this.mydragon) {
    for (var dragonid in this.mydragon) {
      var dragonCount = this.mydragon[dragonid];
      this.dragonCount += dragonCount?1:0;
      this.epicDragonCount += (dragonCount & (1 << 9))?1:0;
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

org.ellab.dragonstory.MyDragon.prototype.hasLevel = function(dragonSetting, level) {
  return (dragonSetting & (1 << (level-1)))?true:false;
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

  var setting = g_mydragon.mydragon || {};

  var tbodyHTML = '';
  var theadHTML = '';
  var dragonCount = 0;
  var epicDragonCount = 0;

  for (var dragonid in breeds) {
    var dragon = breeds[dragonid];
    tbodyHTML += '<tr data-dragonid="' + dragonid + '" data-dragonname="' + dragon.name + '"><td>' + dragon.name +
                 '</td><td>' + ds.getTypeHTML(dragon.types, 16) +
                 '</td><td data-sort-value="' + dragon.rarity + '">' + ds.getRarityDesc(dragon.rarity) +
                 '</td><td data-sort-value="' + ds.getIncubationSeconds(dragon.incubation) + '">' + ds.getIncubationText(dragon.incubation) +
                 '</td>';

    dragonCount += setting[dragonid]?1:0;
    epicDragonCount += (setting[dragonid] & (1 << 9))?1:0;

    for (var i=0 ; i<=10 ; i++) {
      if (i === 0) {
        // selected if setting[dragonid] is undefined or === 0
        tbodyHTML += '<td data-level="0"' + (setting[dragonid]?'':' class="selected"') + '></td>';
      }
      else {
        var selected = setting[dragonid] & (1 << (i-1));
        tbodyHTML += '<td data-level="' + i + '"' + (selected?' class="selected"':'') + '>' + i + '</td>';
      }
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
      if ($this.data('level') === 0) {
        $this.addClass('selected');

        // clear all other level
        $this.parent().find('[data-level!="0"].selected').removeClass('selected');
      }
      else {
        $this.toggleClass('selected');

        if ($this.parent().find('[data-level!="0"].selected').length) {
          // at least one selected
          $this.parent().find('[data-level="0"]').removeClass('selected');
        }
        else {
          // no selected
          $this.parent().find('[data-level="0"]').addClass('selected');
        }
      }

      g_mydragon.set(makeSaveString());
      if (dragonCountSelector) {
        $(dragonCountSelector).html(g_mydragon.dragonCountHTML);
      }
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
                 '" data-dragontype="' + dragon.breed.types.join(',') + '"><td>' + dragon.breed.name +
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
