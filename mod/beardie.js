/*global canny */
/*jslint browser: true*/

/**
 *
 * beardie is a working name for the new whisker. So far I can keep the backward functionality I will rename,
 * beardie to whisker.
 *
 * E.g. {{beardie}}:
 *  <div canny-mod="beardie" canny-var="{'message':'dynamic text'}">
 *     <p>DATA: {{message}})</p>
 *  </div>
 *
 *  TODO:
 *  Remove whiskerUpdate
 *   and just provide a function pointer for whisker - whisker will call the pointer with a
 *   update function pointer so that the external function has the control about the rendered data.
 *
 *   If there is not function pointer so do the same as before or just render the data (first will keep the backward compatibility).
 *
 *  Add attribute replace support
 *   so toggle classes will be so much easier ;-)
 *
 *  Global key usage
 *   So I can also use a global key inside my custom whisker
 *
 *  This is a major change and it should be implemented in a new module with the additional functionality:
 *  * update tag attribute properties
 */
(function () {
    "use strict";

    var openChar = '{',
        endChar  = '}',
        ESCAPE_RE = /[-.*+?^${}()|[\]\/\\]/g,
        beardie = (function () {
            var BINDING_RE = getRegex(),
                whiskerUpdateMap = {};
            /**
             *  Parse a piece of text, return an array of tokens
             *  @param text
             *  @return [{key:String, html:boolean}]
             */
            function parse(text) {
                if (!BINDING_RE.test(text)) {return null; }
                var m, i, token, match, tokens = [];
                /* jshint boss: true */
                while (m = text.match(BINDING_RE)) {
                    i = m.index;
                    if (i > 0) {tokens.push(text.slice(0, i)); }
                    token = { key: m[1].trim() };
                    match = m[0];
                    token.html =
                        match.charAt(2) === openChar &&
                        match.charAt(match.length - 3) === endChar;
                    tokens.push(token);
                    text = text.slice(i + m[0].length);
                }
                if (text.length) {tokens.push(text); }
                return tokens;
            }
            /**
             *
             * @param node
             * @param dataObj
             * @param itemName
             * @return tokens [{key:String, node:DOM node, html: boolean}]
             */
            function compileTextNode(node, dataObj, itemName) {
                var tokens = parse(node.nodeValue),
                    obj = dataObj,
                    el, token, i, l, tmp, tokenObjectProperty, val;
                if (!tokens || obj === undefined || typeof obj === 'string') {return; }

                for (i = 0, l = tokens.length; i < l; i++) {
                    token = tokens[i];

                    if (typeof token === 'object') {
                        tmp = token.key.split('.');
                        if (tmp.length > 0 && tmp[0] === itemName) {
                            tokenObjectProperty = tmp.slice(1).join('.');
                            if (typeof obj === 'object') {
                                val = getGlobalCall(tokenObjectProperty, obj);
                            } else {
                                val = obj;
                            }
                        } else {
                            // just a string?
                            val = obj;
                        }
                        if (typeof val === 'string' || typeof val === 'number') {
                            el = document.createTextNode(val);
                            node.parentNode.insertBefore(el, node);
                        } else if (typeof val === 'boolean') {
                            el = document.createTextNode(val.toString());
                            node.parentNode.insertBefore(el, node);
                        } else if (typeof val === 'function') {
                            el = document.createTextNode(val(node.parentNode));
                            node.parentNode.insertBefore(el, node);
                        } else {
                            // restore the token... looks like is not mine
                            el = document.createTextNode('{{' + token.key + '}}');
                            node.parentNode.insertBefore(el, node);
                        }
                        token.node = el;
                    } else {
                        el = document.createTextNode(token);
                        // just normal string put back to view
                        node.parentNode.insertBefore(el, node);
                    }
                }
                node.parentNode.removeChild(node);
                return tokens;
            }
            /**
             *
             * @param node
             * @param dataObj
             * @param itemName
             */
            function compileElement (node, dataObj, itemName) {
                var tokens = [],
                    token;
                // recursively compile childNodes
                if (node.hasChildNodes()) {
                    [].slice.call(node.childNodes).forEach(function (child) {
                        token = compile(child, dataObj, itemName);
                        if (token) {
                            tokens = tokens.concat(token);
                        }
                    });
                }
                return tokens.length > 0 ? tokens : undefined;
            }
            /**
             *  Compile a DOM node (recursive)
             * @param node
             * @param dataObj
             * @param itemName
             * @returns {*}
             */
            function compile(node, dataObj, itemName) {
                var nodeType = node.nodeType,
                    tokens = [],
                    token;
                if (nodeType === 1 && node.tagName !== 'SCRIPT') { // a normal node
                    token = compileElement(node, dataObj, itemName);
                    if (token) {
                        tokens = tokens.concat(token);
                    }
                } else if (nodeType === 3) {
                    token = compileTextNode(node, dataObj, itemName);
                    if (token) {
                        tokens = tokens.concat(token);
                    }
                }
                return tokens.length > 0 ? tokens : undefined;
            }

            /**
             * Replaces expressions for all tag attributes
             *
             * loop though all children and check if a attribute has a expressions inside
             *
             * @param containerNode
             * @param obj
             * @param itemName
             * @return returnTokens [{key:String, attr: node attribute reference, html: boolean}]
             */
            function handleAttributes(containerNode, obj, itemName) {
                var returnTokens = [];
                (function searchForExpressions(children) {
                    [].slice.call(children).forEach(function (node) {
                        var i, attr, rTokens;
                        if (node.children.length > 0) {
                            // do it recursive for all children
                            searchForExpressions(node.children);
                        }
                        // loop through each attribute
                        for (i = 0; i < node.attributes.length; i++) {
                            attr = node.attributes[i];
                            if (/\{\{/.test(attr.textContent)) {
                                if (attr.name) {
                                    rTokens = (function () {
                                        var token = parse(attr.textContent),
                                            endData = [], tmpToken, j, tmpTokenSplit;
                                        for (j = 0; j < token.length; j++) {
                                            tmpToken = token[j];
                                            // if token not itemName skipp all
                                            if (tmpToken.key !== undefined && tmpToken.key.split('.')[0] === itemName) {
                                                // save the attribute
                                                tmpToken.attr = attr;
                                                if (/\./.test(tmpToken.key)) {
                                                    tmpTokenSplit = tmpToken.key.split('.').slice(1).join('.');
                                                } else {
                                                    tmpTokenSplit = tmpToken.key;
                                                }
                                                if (typeof obj === 'object') {
                                                    tmpToken.value = getGlobalCall(tmpTokenSplit, obj);
                                                    if (typeof tmpToken.value === 'function') {
                                                        endData.push(tmpToken.value());
                                                    } else {
                                                        endData.push(tmpToken.value);
                                                    }
                                                } else if (typeof obj === 'string') {
                                                    endData.push(obj);
                                                } else if (typeof obj === 'function') {
                                                    endData.push(obj(node));
                                                }

                                            } else if (tmpToken.hasOwnProperty('key')) {
                                                // restore the expression - might be another beardie instance will
                                                // needs this
                                                endData.push('{{' + tmpToken.key + '}}');
                                            } else if (tmpToken.key === undefined) {
                                                endData.push(tmpToken.trim());
                                            }
                                        }
                                        attr.textContent = endData.join(' ');
                                        return token;
                                    }());
                                    returnTokens = returnTokens.concat(rTokens);
                                }
                            }
                        }
                    });
                }(containerNode.children));
                return returnTokens;
            }

            /**
             * do the magic for attributes or text nodes
             *
             * @param node
             * @param scopeName
             * @param data
             */
            function fillData(node, scopeName, data) {
                var tokens = [];
                if (typeof data === 'object') {
                    // handleEvents(node, data, scopeName);
                    tokens = tokens.concat(handleAttributes(node, data, scopeName));
                    // replace texts:
                    return tokens.concat(compile(node, data, scopeName));
                } else {
                    console.error('beardie:handleAttributes detect none acceptable data argument', data);
                }
            }

            /**
             * helper function for updateData to update the text nodes
             * @param token
             * @param val
             */
            function updateText(token, val) {

                if (typeof val === 'string' || typeof val === 'number') {
                    token.node.nodeValue = val;
                } else if (typeof val === 'boolean') {
                    // TODO test
                    token.node.nodeValue = val.toString();
                } else if (typeof val === 'function') {
                    // TODO test and implement
                //    token.node.nodeValue = val(token.node.parentNode);
                }
            }

            /**
             * helper function for updateData to update the attributes for a node
             * @param token
             * @param val
             */
            function updateAttributes(token, val) {
                if (typeof val === 'string' || typeof val === 'number') {
                    var replaceText = token.attr.textContent;
                    if (replaceText) {
                        token.attr.textContent = replaceText.replace(token.value, val);
                        token.value = val;
                    }
                } else if (typeof val === 'boolean') {
                    // TODO test
                    token.node.nodeValue = val.toString();
                } else if (typeof val === 'function') {
                    // TODO test and implement
                    //    token.node.nodeValue = val(token.node.parentNode);
                }
            }
            /**
             *
             * TODO test also boolean and function
             *
             * @param tokenObjList [{key : "scopeName.property", node}]
             * @param scopeName
             * @param obj
             */
            function updateData(tokenObjList, scopeName, obj) {
                tokenObjList.forEach(function (token) {
                    if (token && token.hasOwnProperty('key')) {
                        var tmp = token.key.split('.'), tokenObjectProperty, val;
                        if (tmp.length > 0 && tmp[0] === scopeName) {
                            tokenObjectProperty = tmp.slice(1).join('.');
                            if (typeof obj === 'object') {
                                val = getGlobalCall(tokenObjectProperty, obj);
                            } else {
                                val = obj;
                            }

                            if (val !== undefined) {
                                if (token.hasOwnProperty('attr')) {
                                    // handle attribute
                                    updateAttributes(token, val);
                                } else {
                                    updateText(token, val);
                                }
                            }
                        }
                    }
                });
            }

            /**
             * TODO description
             * Create a new beardie instance and do the "magic".
             * @param node
             * @param scopeName
             * @param data
             */
            function exec(node, data, scopeName) {
                var currentScope = scopeName,
                    keyValueholder = {};
                if (typeof data === 'function') {
                    data(function (scope, data) {
                        if (data !== undefined) {
                            currentScope  = scope;
                        } else {
                            data = scope;
                        }
                        if (keyValueholder.hasOwnProperty(scope)) {
                            updateData(keyValueholder[scope], currentScope, data);
                        } else {
                            keyValueholder[scope] = fillData(node, currentScope, data);
                        }
                    });
                } else {
                    fillData(node, currentScope, data)
                }
            }

            return {
                getTextNodes : function () {
                    return whiskerUpdateMap;
                },
                add : function (node, attr) {
                    var inPointer;
                    if (typeof attr === 'object' && attr.in && attr.bind) {
                        if (typeof attr.in === 'string') {
                            // TODO replace window with this and also other instances could use the magic as closure
                            inPointer = getGlobalCall(attr.in, window);
                        } else {
                            inPointer = attr.in;
                        }
                        exec(node, inPointer, attr.bind);
                    } else {
                        inPointer = getGlobalCall(attr, window);
                        if (typeof inPointer === 'function') {
                            exec(node, inPointer);
                        } else {
                            console.warn('beardie:add none acceptable attributes', attr);
                        }
                    }
                }
            };
        }());

    function escapeRegex(str) {
        return str.replace(ESCAPE_RE, '\\$&');
    }

    function getRegex() {
        var open = escapeRegex(openChar),
            end  = escapeRegex(endChar);
        return new RegExp(open + open + open + '?(.+?)' + end + '?' + end + end);
    }

    /**
     * Read a property from a given string and object.
     * Returns the founded property pointer or undefined.
     * @param value
     * @param obj
     * @returns {*} or undefined
     */
    function getGlobalCall (value, obj) {
        var split = value.split('.'),
            rec = function (cur) {
                if (obj[cur] !== undefined) {
                    obj = obj[cur];
                    rec(split.shift());
                } else if (cur === value ) {
                    obj = undefined;
                }
            };
        rec(split.shift());
        return obj;
    }

    // export as module or bind to global
    if (typeof module !== 'undefined' && module.hasOwnProperty('exports')) {
        module.exports = beardie;
    } else {
        canny.add('beardie', beardie);
    }

}());
