var htmldoc = document.implementation.createHTMLDocument("Document parser");
var foreignHTMLDivNode = htmldoc.createElement("div");
foreignHTMLDivNode.setAttribute("style", "widgh:512px;font-size:16px;padding:14px 8px;background:#444444;color:#dcdcdc");

function makeElement(element, attribute, inner) {
  if (typeof(element) === "undefined") {
    return false;
  }
  if (typeof(inner) === "undefined") {
    inner = "";
  }
  var el = document.createElement(element);
  if (typeof(attribute) === "object") {
    for (var key in attribute) {
      el.setAttribute(key, attribute[key]);
    }
  }
  if (!Array.isArray(inner)) {
    inner = [inner];
  }
  for (var k = 0; k < inner.length; k++) {
    if (inner[k].tagName) {
      el.appendChild(inner[k]);
    }
    else {
      el.appendChild(document.createTextNode(inner[k]));
    }
  }
  return el;
}

function getModsByType(mods, type) {
  var typemods = [];
  for (var mod in mods) {
    if (mods[mod].type == type) {
      typemods.push(mods[mod]);
    }
  }
  return typemods;
}

function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&#]*)/gi,    
  function(m, key, value) {
    vars[key] = decodeURIComponent(value);
  });
  return vars;
}

function modTR(packver, mods) {
  var modsrows = [];
  mods.forEach(function(mod) {
    var authors = [];
    switch (typeof(mod.authors) === "undefined" ? 0 : mod.authors.length) {
      case 0:
        var elLiAuthor = makeElement("li", {"class":"mod_author_unknown"}, [makeElement("i",{} ,"Unknown")]);
        authors.push(elLiAuthor);
      break;
      case 1:
        var elLiAuthor = makeElement("li", {"class":"mod_author_single"}, mod.authors[0]);
        authors.push(elLiAuthor);
      break;
      default:
        for (k = 0; k < mod.authors.length; k++) {
          var elLiAuthor = makeElement("li", {"class":"mod_author"},mod.authors[k]);
          authors.push(elLiAuthor);
        }
      break;
    }

    var modwarn = "";
    if (typeof(mod.warning) !== "undefined"
      && typeof(packver.warnings) !== "undefined"
      && packver.warnings[mod.warning] !== "undefined") {
      foreignHTMLDivNode.innerHTML = packver.warnings[mod.warning];
      var modwarn = makeElement("details", {"style":"color:#DD7700;font-weight:800;"}, [
        makeElement("summary", {"class":"modlist_warn"}, "⚠ WARNING"),
        ]);
      modwarn.appendChild(document.importNode(foreignHTMLDivNode, true));
    }

    var tr = makeElement("tr", {"style":"vertical-align:top","id":"mod-" + mod.name.safeCSSId()}, [
      makeElement("td", {"style":"vertical-align:top;text-align:left"},
        makeElement("a", {"href":mod.website}, mod.name)
      ),
      makeElement("td", {"style":"vertical-align:top;text-align:center"}, mod.version),
      makeElement("td", {"style":"vertical-align:top;text-align:left"}, makeElement("ul", {"style":"list-style:none;margin:0;padding:0"}, authors)),
      makeElement("td", {"style":"vertical-align:top;text-align:left"}, [mod.description, modwarn]),
    ]);
    modsrows.push(tr);
  });
  return modsrows;
}

Array.prototype.keySort = function(key, desc) {
  this.sort(function(a, b) {
    var la = a[key].toLowerCase();
    var lb = b[key].toLowerCase();
    var result = desc ? (la < lb) : (la > lb);
    return result ? 1 : -1;
  });
  return this;
}

String.prototype.safeCSSId = function() {
  return encodeURIComponent(this.toLowerCase()).replace(/%[0-9A-F]{2}/gi,"-");
}

String.prototype.capFrst = function() {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

PackVersions = function(name, version) {
  this.name = name;
  this.version = version;
  this.url = "https://download.nodecdn.net/containers/atl/packs/"
    + name.replace(/[\s:_-]*/gi,"")
    + "/versions/"
    + version
    + "/Configs.json";
}

PackVersions.prototype = {
  fetch: function() {
    var parent = this;
    parent.xmlhttp = new XMLHttpRequest();
    parent.xmlhttp.open("GET", this.url, true);
    parent.xmlhttp.onreadystatechange = function(aEvt) {
      if (parent.xmlhttp.readyState === XMLHttpRequest.DONE && parent.xmlhttp.status == 200) {
//      console.log("responseText:\n" + xmlhttp.responseText);
        try {
          var data = JSON.parse(parent.xmlhttp.responseText);
          parent.data = data;
        }
        catch(err) {
          console.log(err.message + " in " + xmlhttp.responseText);
          return;
        }
        parent.display();
      }
    }.bind(parent);
    this.xmlhttp.send();
  },

  display: function() {
    if (typeof(this.data) === "undefined") {
      console.log("Fetch first!!!");
      return
    }
    var renderNode = document.getElementById("modlist");
    var modlist = document.createDocumentFragment();

    var forge = getModsByType(this.data.mods, "forge").concat(
      getModsByType(this.data.mods, "mcpc"))[0];

    var stdmods = getModsByType(this.data.mods, "mods").concat(
      getModsByType(this.data.mods, "jar").concat(
        getModsByType(this.data.mods, "flan")
        )
      ).keySort("name");

    var plugins = getModsByType(this.data.mods, "plugins").keySort("name");

    var resources = getModsByType(this.data.mods, "resourcepack").concat(
      getModsByType(this.data.mods, "extract").concat(
        getModsByType(this.data.mods, "decomp")
        )
      ).keySort("name");

    var depmods = getModsByType(this.data.mods, "dependency").concat(
      getModsByType(this.data.mods, "coremods")
    ).keySort("name");

    modlist.appendChild(makeElement("h1", {"id":"modlist_packtitle"}, this.name));
    modlist.appendChild(makeElement("ul", {}, [makeElement("li", {}, "Version: " + this.version)]));
    modlist.appendChild(makeElement("h2", {"id":"modlist_mcversion"}, "An ATLauncher Mod-pack for Minecraft: " + this.data.minecraft));
    modlist.appendChild(makeElement("h3", {}, "Powered by"));
    modlist.appendChild(makeElement("ul", {}, [
      makeElement("li", {}, forge.name + " " + forge.version),
      stdmods.length > 0 ?
        makeElement("li", {}, makeElement("a", {"href":"#modlist_mods"}, stdmods.length + " Mods"))
        : "",
      plugins.length > 0 ?
        makeElement("li", {}, makeElement("a", {"href":"#modlist_plugins"}, plugins.length + " Plugins"))
        : "",
      resources.length > 0 ?
        makeElement("li", {}, makeElement("a", {"href":"#modlist_resources"}, resources.length + " Resources"))
        : "",
      depmods.length > 0 ?
        makeElement("li", {}, makeElement("a", {"href":"#modlist_depend"}, depmods.length + " Dependency/Core Mods"))
        : ""
    ]));

    if (typeof(this.data.messages) !== "undefined" && Object.keys(this.data.messages).length > 0) {
      modlist.appendChild(makeElement("h2", {"id":"modlist_messages"}, "Messages"));
      for (msgId in this.data.messages) {
        foreignHTMLDivNode.innerHTML = this.data.messages[msgId];

        var msgfragment = makeElement("details", {"class":"modlist_msg"}, [
          makeElement("summary", {"class":"modlist_msg","id":"modlist_msg_" + msgId.safeCSSId()}, msgId.capFrst()),
          ]);
        msgfragment.appendChild(document.importNode(foreignHTMLDivNode, true));
        modlist.appendChild(msgfragment);
      }
    }

    if (stdmods.length > 0) {
      modlist.appendChild(makeElement("h2", {"id":"modlist_mods"}, "Mods"));
      modlist.appendChild(makeElement("table", {"id":"modlist_modstable","class":"modlist_table"}, [
        makeElement("thead", {}, [
          makeElement("tr", {}, [
            makeElement("th", {"style":"text-align:left"}, "Mod"),
            makeElement("th", {"style":"text-align:center"}, "Version"),
            makeElement("th", {"style":"text-align:left"}, "Authors"),
            makeElement("th", {"style":"text-align:left"}, "Description")
          ])
        ]),
        makeElement("tbody", {}, modTR(this.data, stdmods))
      ]));
    }

    if (plugins.length > 0) {
      modlist.appendChild(makeElement("h2", {"id":"modlist_plugins"}, "Plugins"));
      modlist.appendChild(makeElement("table", {"id":"modlist_pluginstable","class":"modlist_table"}, [
        makeElement("thead", {}, [
          makeElement("tr", {}, [
            makeElement("th", {"style":"text-align:left"}, "Mod"),
            makeElement("th", {"style":"text-align:center"}, "Version"),
            makeElement("th", {"style":"text-align:left"}, "Authors"),
            makeElement("th", {"style":"text-align:left"}, "Description")
          ])
        ]),
        makeElement("tbody", {}, modTR(this.data, plugins))
      ]));
    }


    if (resources.length > 0) {
      modlist.appendChild(makeElement("h2", {"id":"modlist_resources"}, "Resources"));
      modlist.appendChild(makeElement("table", {"id":"modlist_resourcestable","class":"modlist_table"}, [
        makeElement("thead", {}, [
          makeElement("tr", {}, [
            makeElement("th", {"style":"text-align:left"}, "Mod"),
            makeElement("th", {"style":"text-align:center"}, "Version"),
            makeElement("th", {"style":"text-align:left"}, "Authors"),
            makeElement("th", {"style":"text-align:left"}, "Description")
          ])
        ]),
        makeElement("tbody", {}, modTR(this.data, resources))
      ]));
    }

    if (depmods.length > 0) {
      modlist.appendChild(makeElement("h2", {"id":"modlist_depend"}, "Dependency/Core Mods"));
      modlist.appendChild(makeElement("table", {"id":"modlist_deptable","class":"modlist_table"}, [
        makeElement("thead", {}, [
          makeElement("tr", {}, [
            makeElement("th", {"style":"text-align:left"}, "Mod"),
            makeElement("th", {"style":"text-align:center"}, "Version"),
            makeElement("th", {"style":"text-align:left"}, "Authors"),
            makeElement("th", {"style":"text-align:left"}, "Description")
          ])
        ]),
        makeElement("tbody", {}, modTR(this.data, depmods))
      ]));
    }

    renderNode.appendChild(modlist);

  }
  
};

function displayVersion(packname, packversion)
{
  var renderNode = document.getElementById("modlist");
  var urlvars = getUrlVars();
  var anchor = window.location.hash.slice(1);
  
  packname = urlvars["p"] ? urlvars["p"] : packname;
  packversion = urlvars["v"] ? urlvars["v"] : packversion;

  var pack = new PackVersions(packname, packversion);

  pack.fetch();

  /* Observe when the generated document fragment
   * has been attached to its element
   * scroll view to matching element ID, now that it exists
   *
   * @var
   * renderNode: The element to observe
   * anchor: The location hash to scroll to
   */
  var observer = new MutationObserver(function(mutations) {
    observer.disconnect();
    if (typeof(anchor) !== "undefined" && anchor !== "" ){
      var target = window.document.getElementById(anchor);
      if (target != null) {
        document.getElementById(anchor).scrollIntoView({block: "start", behavior: "instant"});
      }
    }
  });

  observer.observe(renderNode, { childList: true });
}

window.onload = function () {
  displayVersion("Beyond Reality: Farscapes", "devBuild1.11");
}
