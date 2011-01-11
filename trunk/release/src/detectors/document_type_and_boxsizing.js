/**
 * Copyright 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview: One detector implementation for checking the real document
 * mode in IE and WebKit browsers, and the box which the 'width' and 'height'
 * properties apply.
 * @bug: https://code.google.com/p/compatibility-detector/issues/detail?id=56
 * @bug: https://code.google.com/p/compatibility-detector/issues/detail?id=57
 *
 * The comment or XML declaration before DTD will make the DTD be invalid in IE
 * so that the HTML document will be in quirks mode in IE. We must get the real
 * document mode in IE and WebKit first, and save this state because it is
 * useful in checkNode function. To improve the performance, the said steps have
 * to execute in the constructor function. Note that there are several strange
 * DTDs that have the document mode in IE and non-IE browser be different. We
 * must consider them.
 * Check the box which the 'width' and 'height' properties apply for all kinds
 * of elements according to the root cause article RD8001 (refer to
 * http://www.w3help.org/zh-cn/causes/RD8001).
 * We also must notice the -webkit-box-sizing property the author uses.
 */

addScriptToInject(function() {

/**
 * The comment or XML declaration before DTD will make the DTD be invalid in IE
 * so that the HTML document will be in quirks mode in IE.
 */
function hasCommentBeforeDTD(element) {
  var prev = element;
  if (!prev)
    return;
  while (prev.previousSibling)
    prev = prev.previousSibling;
  if (prev && prev.nodeType == 8 && !chrome_comp.inQuirksMode()) {
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

function hasHorizontalBorder(element) {
  var style = chrome_comp.getComputedStyle(element);
  var borderRight = parseInt(style.borderRightWidth, 10);
  var borderLeft = parseInt(style.borderLeftWidth, 10);
  return borderRight || borderLeft;
}

function hasVerticalBorder(element) {
  var style = chrome_comp.getComputedStyle(element);
  var borderTop = parseInt(style.borderTopWidth, 10);
  var borderBottom = parseInt(style.borderBottomWidth, 10);
  return borderTop || borderBottom;
}

function hasHorizontalPadding(element) {
  var style = chrome_comp.getComputedStyle(element);
  var paddingRight = parseInt(style.paddingRight, 10);
  var paddingLeft = parseInt(style.paddingLeft, 10);
  return paddingRight || paddingLeft;
}

function hasVerticalPadding(element) {
  var style = chrome_comp.getComputedStyle(element);
  var paddingTop = parseInt(style.paddingTop, 10);
  var paddingBottom = parseInt(style.paddingBottom, 10);
  return paddingTop || paddingBottom;
}

function getRealComputedWidthAndHeight(element) {
  var x = element.cloneNode(false);
  x.style.display = 'none !important';
  var parent = element.parentElement;
  if (!parent)
    return true;
  if (parent.lastElementChild === element)
    parent.appendChild(x);
  else
    parent.insertBefore(x, element);
  var width = chrome_comp.getComputedStyle(x).width;
  var height = chrome_comp.getComputedStyle(x).height;
  parent.removeChild(x);
  x = null;
  return { width: width, height: height };
}

function isWidthStretched(element) {
  var ch = element.children;
  var w = parseInt(chrome_comp.getComputedStyle(element).width, 10);
  if (ch.length < 1)
    return;
  for (var i = 0, j = ch.length; i < j; i++) {
    var width = ch[i].offsetWidth;
    if (width >= w)
      return true;
  }
}

function isHeightStretched(element) {
  var ch = element.children;
  var h = parseInt(chrome_comp.getComputedStyle(element).height, 10);
  var lh = parseInt(chrome_comp.getComputedStyle(element).lineHeight, 10);
  if (lh >= h)
    return true;
  if (ch.length < 1)
    return;
  for (var i = 0, j = ch.length; i < j; i++) {
    var height = ch[i].offsetHeight;
    if (height >= h)
      return true;
  }
}

function isTableElement(element) {
  return chrome_comp.getComputedStyle(element).display.indexOf('table') != -1;
}

chrome_comp.CompDetect.declareDetector(

'document_type_and_boxsizing',

chrome_comp.CompDetect.ScanDomBaseDetector,

function constructor(rootNode) {
  // Must save this state because it is useful in checkNode function.
  this.commentBeforeDTD = hasCommentBeforeDTD(rootNode);
  // There are several strange DTDs that have the document mode in IE and
  // non-IE browser be different. And we must know the real document mode
  // triggered by the present DTD in IE and WebKit browsers.
  this.doctypeInIE = '';
  this.doctypeInWebKit = '';
  var diffMap;
  var doctype = document.doctype;
  var compatMode = document.compatMode.toLowerCase();
  var publicId = (doctype) ? doctype.publicId : 0;
  var systemId = (doctype) ? doctype.systemId : 0;
  this.doctypeInIE = this.doctypeInWebKit =
      (compatMode == 'backcompat') ? 'Q' : 'S';
  if (this.commentBeforeDTD)
    this.doctypeInIE = 'Q';
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
    'ISO/IEC 15445:1999//DTD HTML//EN': {
      'systemId': '',
      'IE': 'Q',
      'WebKit': 'S'
    },
    '-//W3C//DTD HTML 4.0 Transitional//EN': {
      'systemId': 'http://www.w3.org/TR/REC-html40/loose.dtd',
      'IE': 'S',
      'WebKit': 'Q'
    }
  }
  if (diffMap[publicId]) {
    if (diffMap[publicId]['systemId'] == systemId) {
      this.doctypeInIE = diffMap[publicId]['IE'];
      this.doctypeInWebKit = diffMap[publicId]['WebKit'];
    }
  }
  if (doctype && doctype.name ==
      '"xmlns:xsl=\'http://www.w3.org/1999/xsl/transform\'"') {
    this.doctypeInIE = 'S';
    this.doctypeInWebKit = 'Q';
  }
},

function checkNode(node, context) {
  if (Node.ELEMENT_NODE != node.nodeType || context.isDisplayNone())
    return;

  var tag = node.tagName;

  if (tag == 'SCRIPT')
    return;

  var inputType = '';
  if (tag == 'HTML') {
    if (this.commentBeforeDTD) {
      this.addProblem('HG8001', [node]);
    }
    return;
  }

  if (this.doctypeInIE == 'S' && this.doctypeInWebKit == 'S')
    return

  var display = chrome_comp.getComputedStyle(node).display;
  if (display == 'inline' || display == 'none')
    return;

  if (isTableElement(node))
    return;

  var real = getRealComputedWidthAndHeight(node);
  if (real.width == 'auto' && real.height == 'auto')
    return;
  if (real.width != 'auto' && !hasHorizontalPadding(node) &&
      !hasHorizontalBorder(node))
    return;
  if (real.height != 'auto' && !hasVerticalPadding(node) &&
      !hasVerticalBorder(node))
    return;
  if (real.width != 'auto' && isWidthStretched(node))
    return;
  if (real.height != 'auto' && isHeightStretched(node))
    return;

  if (tag == 'INPUT')
    inputType = chrome_comp.getAttributeLowerCase(node, 'type');

  // In following cases, there are no differences in all browsers.
  if (tag == 'TABLE' || tag == 'IMG')
    return;

  // Some authors may use -webkit-box-sizing property to make the value of width
  // and height apply on border box in WebKit browsers. So we must ignore this
  // situation.
  var boxSizing = chrome_comp.getComputedStyle(node).webkitBoxSizing;

  var isButton;
  var isTextBox;
  if ((tag == 'BUTTON') || (tag == 'INPUT' && (inputType == 'button' ||
      inputType == 'submit' || inputType == 'reset')))
    isButton = true;
  if ((tag == 'TEXTAREA') || (tag == 'INPUT' && (inputType == 'text' ||
      inputType == 'password')))
    isTextBox = true;

  if (!chrome_comp.isReplacedElement(node)) {
    if (this.doctypeInIE == 'Q' && boxSizing != 'border-box') {
      this.addProblem('RD8001', [node]);
      return;
    }
    if (this.doctypeInIE == 'S' && boxSizing == 'border-box') {
      this.addProblem('RD8001', [node]);
      return;
    }
  } else {
    if (isTextBox && (this.doctypeInIE != this.doctypeInWebKit)) {
      if (this.doctypeInIE == 'Q' && boxSizing != 'border-box')
        this.addProblem('RD8001', [node]);
      return;
    } else if (isButton && (this.doctypeInIE != this.doctypeInWebKit)) {
      if (this.doctypeInIE == 'Q' && boxSizing != 'border-box')
        this.addProblem('RD8001', [node]);
      return;
    } else if (tag == 'IFRAME' && this.doctypeInIE == 'Q' && hasPadding(node)) {
      this.addProblem('RD8001', [node]);
      return;
    }
  }
}
); // declareDetector

});