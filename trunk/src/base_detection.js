var detectionType = 'base';
if (window.sessionStorage['chrome_comp_detection_status'] == 'enabled') {
  detectionType = 'advanced';
}
var summaryInformation = null;

chrome.extension.onRequest.addListener(function(request, sender, response) {
  switch (request.type) {
    case 'checkPermission':
      response();
      break;
    case 'getDetectionType':
      response(document.readyState == 'complete' ? detectionType : null);
      break;
    case 'setDetectionType':
      detectionType = request.detectionType;
      response(detectionType);
      break;
    case 'baseDetection':
      response(summaryInformation ? summaryInformation : baseDetection());
      break;
  }
});

/**
 * Base detection.
 */
function baseDetection() {
  var HTMLDeprecatedTag = {
    'APPLET': true,
    'BASEFONT': true,
    'CENTER': true,
    'DIR': true,
    'FONT': true,
    'ISINDEX': true,
    'MENU': true,
    'S': true,
    'STRIKE': true,
    'U': true
  };

  var HTMLDeprecatedAttribute = {
    'align':{
      'CAPTION': true,
      'APPLET': true,
      'IFRAME': true,
      'IMG': true,
      'INPUT': true,
      'OBJECT': true,
      'LEGEND':true,
      'TABLE':true,
      'HR': true,
      'DIV': true,
      'H1': true,
      'H2': true,
      'H3': true,
      'H4': true,
      'H5': true,
      'H6': true,
      'P': true
    },
    'alink':{
      'BODY': true
    },
    'alt': {
      'APPLET': true
    },
    'archive': {
      'APPLET': true
    },
    'background': {
      'BODY': true
    },
    'bgcolor': {
      'TABLE': true,
      'TR': true,
      'TD': true,
      'TH': true,
      'BODY': true
    },
    'border': {
      'IMG': true,
      'OBJECT': true
    },
    'clear': {
      'BR': true
    },
    'code': {
      'APPLET': true
    },
    'codebase': {
      'APPLET': true
    },
    'color': {
      'BASEFONT': true,
      'FONT': true
    },
    'compact': {
      'DIR': true,
      'DL': true,
      'MENU': true,
      'OL': true,
      'UL': true
    },
    'face': {
      'BASEFONT': true,
      'FONT': true
    },
    'height': {
      'TD': true,
      'TH': true,
      'APPLET': true
    },
    'hreflang': {
      'A': true,
      'LINK': true
    },
    'language': {
      'SCRIPT': true
    },
    'link': {
      'BODY':true
    },
    'name': {
      'APPLET':true
    },
    'noshade': {
      'HR': true
    },
    'nowrap': {
      'TD': true,
      'TH': true
    },
    'object': {
      'APPLET': true
    },
    'prompt': {
      'ISINDEX': true
    },
    'size': {
      'HR': true,
      'FONT': true,
      'BASEFONT':true
    },
    'start': {
      'OL': true
    },
    'text': {
      'BODY': true
    },
    'type':{
      'LI': true,
      'OL': true,
      'UL': true
    },
    'value': {
      'LI': true
    },
    'version': {
      'HTML': true
    },
    'vlink': {
      'BODY': true
    },
    'vspace': {
      'APPLET': true,
      'IMG': true,
      'OBJECT': true
    },
    'width': {
      'HR': true,
      'TD, ': true,
      'TH': true,
      'APPLET': true,
      'PRE': true
    }
  };

  summaryInformation = {
    'HTMLBase': {
      'HTMLDeprecatedAttribute': {},
      'HTMLDeprecatedTag': {}
    },
    'documentMode':{
      'pageDTD': '',
      'compatMode': {}
    },
    'DOM': {
      'count': 0,
      'IECondComm': []
    },
    'STYLE': {
      'totalCount': 0,
      'noInBodyCount': 0
    },
    'SCRIPT': {
      'totalCount': 0,
      'noInBodyCount': 0
    }
  };

  var infoManager = {
     'getNodes': function(rootNode,func) {
        var nodeIterator = document.createNodeIterator(
            rootNode, NodeFilter.SHOW_ALL, null, false);
        var currentNode;
        var nodes = [];
        while (currentNode = nodeIterator.nextNode()) {
          if (func(currentNode))
            nodes.push(currentNode);
        }
        return nodes;
     },
    'HTMLBase': {
      'addDeprecatedTag': function(paramObject) {
        var element = paramObject.element;
        var tagName = element.tagName;
        var HTMLDeprecatedTag = summaryInformation.HTMLBase.HTMLDeprecatedTag;
        if (!HTMLDeprecatedTag[tagName]) {
          HTMLDeprecatedTag[tagName] = true;
        }
      },

      'addDeprecatedAttribute': function(paramObject) {
        var element = paramObject.element;
        var attribute = paramObject.attr;
        var tagName = element.tagName;
        var HTMLDeprecatedAttribute =
            summaryInformation.HTMLBase.HTMLDeprecatedAttribute;
        if (!HTMLDeprecatedAttribute[attribute]) {
          HTMLDeprecatedAttribute[attribute] = {};
        }
        HTMLDeprecatedAttribute[attribute][tagName] = tagName;
      },

      'getDeprecatedTagCount': function() {
        return this.HTMLDeprecatedTag[tagName]['elements'].length;
      },

      'getHTMLDeprecatedAttributeCount': function(attribute) {
        return this.HTMLDeprecatedTag[attribute]['elements'].length;
      },

      'getHTMLDeprecatedAttributeTags': function(attribute) {
        var tags = [];
        var attributes = this.HTMLDeprecatedTag[attribute];
        for (var i in attributes['tags'])
          tags.push(i);
        return tags.join(',');
      },
      'getHTMDeprecatedTags': function() {
        var tags = [];
        var HTMLDeprecatedTag = this.HTMLDeprecatedTag;
        for (var i in  HTMLDeprecatedTag)
          tags.push(i);
        return tags.join(',');
      }
    },
    'documentMode': {
      'getPageDTD': function() {
        summaryInformation.documentMode.pageDTD =
            document.doctype ? true : false;
      },
      'getCompatMode': function() {
        function hasCommentBeforeDTD() {
          var prev = document.documentElement;
          if (!prev)
            return;
          var cm = document.compatMode.toLowerCase();
          while (prev.previousSibling)
            prev = prev.previousSibling;
          if (prev && prev.nodeType == 8 && cm == 'css1compat') {
            var comm = prev.nodeValue.split(/\s+/);
            if (comm.length < 1)
              return prev;
            if (comm[0] != '[if')
              return prev;
            if (/^!IE/g.test(comm[1]))
              return;
            return prev;
          }
        }

        var whiteList = {
          '-//W3C//DTD HTML 3.2 Final//EN': {
            'systemId': ''
          },
          '-//W3C//DTD HTML 4.0//EN': {
            'systemId': ''
          },
          '-//W3C//DTD HTML 4.01//EN': {
            'systemId': ''
          },
          '-//W3C//DTD HTML 4.0//EN': {
            'systemId': 'http://www.w3.org/TR/html4/strict.dtd'
          },
          '-//W3C//DTD HTML 4.01//EN': {
            'systemId': 'http://www.w3.org/TR/html4/strict.dtd'
          },
          '-//W3C//DTD HTML 4.0 Transitional//EN': {
            'systemId': ''
          },
          '-//W3C//DTD HTML 4.01 Transitional//EN': {
            'systemId': ''
          },
          '-//W3C//DTD HTML 4.01 Transitional//EN': {
            'systemId': 'http://www.w3.org/TR/html4/loose.dtd'
          },
          '-//W3C//DTD HTML 4.01 Transitional//EN': {
            'systemId':
                'http://www.w3.org/TR/1999/REC-html401-19991224/loose.dtd'
          },
          '-//W3C//DTD XHTML 1.1//EN': {
            'systemId': 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'
          },
          '-//W3C//DTD XHTML Basic 1.0//EN': {
            'systemId': 'http://www.w3.org/TR/xhtml-basic/xhtml-basic10.dtd'
          },
          '-//W3C//DTD XHTML 1.0 Strict//EN': {
            'systemId': 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'
          },
          '-//W3C//DTD XHTML 1.0 Transitional//EN': {
            'systemId':
                'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'
          },
          'ISO/IEC 15445:1999//DTD HyperText Markup Language//EN': {
            'systemId': ''
          },
          '-//W3C//DTD HTML 4.0 Transitional//EN': {
            'systemId': 'http://www.w3.org/TR/html4/loose.dtd'
          },
          'ISO/IEC 15445:2000//DTD HTML//EN': {
            'systemId': ''
          },
          'ISO/IEC 15445:1999//DTD HTML//EN': {
            'systemId': ''
          },
          '-//W3C//DTD HTML 4.0 Transitional//EN': {
            'systemId': 'http://www.w3.org/TR/REC-html40/loose.dtd'
          },
        };

        var doctypeInIE;
        var doctypeInWebKit;
        var diffMap;
        var doctype = document.doctype;
        var name = (doctype) ? doctype.name.toLowerCase() : 0;
        var pid = (doctype) ? doctype.publicId : 0;
        var sid = (doctype) ? doctype.systemId : 0;
        var cm = document.compatMode.toLowerCase();
        if (name != 'html')
          summaryInformation.documentMode.strangeName = true;
        if (!whiteList[pid])
          summaryInformation.documentMode.strangePublicId = true;
        if (whiteList[pid] && whiteList[pid].systemId != sid)
          summaryInformation.documentMode.strangeSystemId = true;
        if (name == 'html' && pid == '' && sid == '') {
          summaryInformation.documentMode.strangePublicId = false;
          summaryInformation.documentMode.strangeSystemId = false;
        }
        doctypeInIE = doctypeInWebKit = (cm == 'backcompat') ? 'Q' : 'S';
        if (hasCommentBeforeDTD()) {
          doctypeInIE = 'Q';
          summaryInformation.documentMode.hasCommentBeforeDTD = true;
        }
        diffMap = {
          '-//W3C//DTD HTML 4.0 Transitional//EN': {
            'systemId': 'http://www.w3.org/TR/html4/loose.dtd',
            'IE': 'S',
            'WebKit': 'Q'
          },
          'ISO/IEC 15445:2000//DTD HTML//EN': {
            'systemId': '',
            'IE': 'Q',
            'WebKit': 'S'
          },
          "ISO/IEC 15445:1999//DTD HTML//EN": {
            "systemId": "",
            "IE": "Q",
            "WebKit": "S"
          },
          '-//W3C//DTD HTML 4.0 Transitional//EN': {
            'systemId': 'http://www.w3.org/TR/REC-html40/loose.dtd',
            'IE': 'S',
            'WebKit': 'Q'
          }
        }
        if (diffMap[pid]) {
          if (diffMap[pid]['systemId'] == sid) {
            doctypeInIE = diffMap[pid]['IE'];
            doctypeInWebKit = diffMap[pid]['WebKit'];
          }
        }
        if (document.doctype && document.doctype.name ==
            '"xmlns:xsl=\' http://www.w3.org/1999/xsl/transform\'"') {
          doctypeInIE = 'S';
          doctypeInWebKit = 'Q';
        }
        summaryInformation.documentMode.compatMode.IE = doctypeInIE;
        summaryInformation.documentMode.compatMode.WebKit = doctypeInWebKit;
      }
    },
    'DOM': {
      'getDOMCount': function() {
        summaryInformation.DOM.count =
            document.getElementsByTagName('*').length;
      },
      'getIECondComm': function(rootNode) {
        var nodes = infoManager.getNodes(rootNode,function(node) {
          if (node.COMMENT_NODE == node.nodeType)
            return true;
        });
        var ieCondCommRegExp = /\[\s*if\s*[^\]][\s\w]*\]/i;
        for (var i = 0, c = nodes.length; i < c; i++) {
          var currentNode = nodes[i];
          if (ieCondCommRegExp.test(currentNode.nodeValue))
            summaryInformation.DOM.IECondComm.push(currentNode.nodeValue);
        }
      }
    },
    'STYLE': {
      'getTotalCount': function() {
        var styles = document.getElementsByTagName("STYLE");
        var len = styles.length;
        for (var i = 0; i <len; i++) {
          if (styles[i].parentElement.tagName == 'DIV' &&
              styles[i].parentElement.getAttribute('class') ==
              'chrome-comp-annotations') {
            --len;
          }
        }
        summaryInformation.STYLE.totalCount = len;
      },
      'getNoInBodyCount': function() {
        var styles = document.getElementsByTagName("STYLE");
        var len = styles.length;
        var counter = 0;
        for(var i = 0 ; i < len; i++){
          if (styles[i].parentElement.tagName != 'HEAD' &&
              !(styles[i].parentElement.tagName == 'DIV' &&
              styles[i].parentElement.getAttribute('class') ==
              'chrome-comp-annotations')) {
            ++counter;
          }
        }
        summaryInformation.STYLE.noInBodyCount = counter;
      }      
    },
    'SCRIPT': {
      'getTotalCount': function() {
        var scripts = document.getElementsByTagName("SCRIPT");
        var len = scripts.length;
        for (var i = 0; i <len; i++) {
          if (scripts[i].parentElement.tagName == 'HTML' &&
              scripts[i].parentElement.getAttribute('chrome_comp_injected') ==
              'true') {
            len--;
          }
        }
        summaryInformation.SCRIPT.totalCount = len;
      },
      'getNoInBodyCount': function() {
        var scripts = document.getElementsByTagName("SCRIPT");
        var len = scripts.length;
        var counter = 0;
        for(var i = 0 ; i < len; i++){
          if (scripts[i].parentElement.tagName != 'HEAD' &&
              !(scripts[i].parentElement.tagName == 'HTML' &&
              scripts[i].parentElement.getAttribute('chrome_comp_injected') ==
              'true')) {
            counter++;
          }
        }
        summaryInformation.SCRIPT.noInBodyCount = counter;
      }      
    }
  };

  function isHTMLDeprecatedAttribute(paramObject) {
    return !!(HTMLDeprecatedAttribute[paramObject.attr] &&
              HTMLDeprecatedAttribute[paramObject.attr][paramObject.tagName]);
  }

  function isHTMLDeprecatedTag(paramObject) {
    return !!HTMLDeprecatedTag[paramObject.tagName];
  }

  function scanAllElements() {
    var elementList =
        Array.prototype.slice.call(document.getElementsByTagName('*'));
    for (var i = 0, len = elementList.length; i < len; i++) {
      var element = elementList[i];
      var tagName = element.tagName;
      var attributes = element.attributes;
      if (isHTMLDeprecatedTag({'tagName': tagName})) {
        infoManager.HTMLBase.addDeprecatedTag({
          'element': element,
          'tagName': tagName
        });
      }
      for (var j = 0, c = attributes.length; j < c; j++) {
        var attrName = attributes[j].name;
        if (isHTMLDeprecatedAttribute({'tagName': tagName,
            'attr': attrName})) {
          infoManager.HTMLBase.addDeprecatedAttribute({
            'element': element,
            'attr': attrName
          });
        }
      }
    }
  }

  scanAllElements();
  infoManager.documentMode.getPageDTD();
  infoManager.DOM.getDOMCount();
  infoManager.STYLE.getTotalCount();
  infoManager.STYLE.getNoInBodyCount();
  infoManager.SCRIPT.getTotalCount();
  infoManager.SCRIPT.getNoInBodyCount();
  infoManager.documentMode.getCompatMode();
  infoManager.DOM.getIECondComm(document.documentElement);

  var status = 'ok';
  if (!summaryInformation.documentMode.pageDTD ||
      (summaryInformation.documentMode.pageDTD &&
      (summaryInformation.documentMode.strangeName ||
      summaryInformation.documentMode.strangePublicId ||
      summaryInformation.documentMode.strangeSystemId ||
      summaryInformation.documentMode.hasCommentBeforeDTD ||
      !(summaryInformation.documentMode.compatMode.IE ==
      summaryInformation.documentMode.compatMode.WebKit &&
      summaryInformation.documentMode.compatMode.IE == 'S'))) ||
      summaryInformation.DOM.IECondComm.length ||
      summaryInformation.STYLE.noInBodyCount != 0 ||
      summaryInformation.SCRIPT.noInBodyCount != 0 ||
      Object.keys(summaryInformation.HTMLBase.HTMLDeprecatedTag).length ||
      Object.keys(summaryInformation.HTMLBase.HTMLDeprecatedAttribute).length) {
    status = 'warning';
  }
  chrome.extension.sendRequest({
    type: 'setStatus',
    status: status
  });
  return summaryInformation;
}