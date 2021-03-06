/*global canny */
/*jslint browser: true */
/**
 * handle the window resize and calculate the window dimensions only once.
 */
(function () {
    'use strict';
    var cannyWindow = (function () {
        var resizeListenerQueue = [],
            iosCheck = {
                isIos7: navigator.userAgent.match(/iPad;.*CPU.*OS 7_\d/i),
                isIos8: navigator.userAgent.match(/iPad;.*CPU.*OS 8_\d/i)
            };

        function addResizeListener(fc) {
            resizeListenerQueue.push(fc);
        }

        function getDimension() {
            var ret = {
                    w: (document.documentElement.clientWidth || window.innerWidth),
                    h: (document.documentElement.clientHeight || window.innerHeight),
                    mx: (document.documentElement.clientWidth || window.innerWidth) / 2,
                    my: (document.documentElement.clientHeight || window.innerHeight) / 2
                },
                dummyNode = document.createElement("div");

            // Fix for ios7 - there is a 20px wrong calculation for the window height
            if (iosCheck.isIos7) {
                ret.h = window.innerHeight; // ? window.innerHeight : $(window).height() - 60;
            }

            // add remove to force redraw
            // some browsers may ignore workarounds like width=width
            document.body.appendChild(dummyNode);
            document.body.removeChild(dummyNode);

            return {
                w: ret.w,
                h: ret.h,// - offsetHeight ,
                mx: ret.mx,
                my: ret.my
            };
        }
        /**
         * IOS 8 Fix for returning wrong window height when more than one tab is open.
         */
        function iOS8MultiTabFix() {
            // PAGE VISIBILITY
            // Check if 'hidden' property exists in document.
            var hiddenProp = (function () {
                    // if 'hidden' is natively supported just return it
                    if ('hidden' in document) {
                        return 'hidden';
                    }
                    if (('webkitHidden') in document) {
                        return 'webkitHidden';
                    }
                    // otherwise it's not supported
                    return false;
                }()),

            // Return state of hidden property
                isHidden = function () {
                    return hiddenProp ? document[hiddenProp] : false;
                },

            // Scroll window to top timeout wrapper
                windowScrollToTop = function () {
                    window.scrollTo(0, 0);
                },
            // Visible / hidden state event handler
                visibleChangeHandler = function () {
                    if (!isHidden()) {
                        setTimeout(windowScrollToTop, 800);
                    }
                },
                evtname;
            // Add listener for tab activated
            if (hiddenProp) {
                evtname = hiddenProp.replace(/[H|h]idden/, '') + 'visibilitychange';
                document.addEventListener(evtname, visibleChangeHandler);
            }
        }

        canny.ready(function () {
            window.addEventListener('resize', function BrowserResizeListener() {
                var dim = getDimension();
                resizeListenerQueue.forEach(function (fc) {
                    fc(dim);
                });
            });
            // Only add listener if iOS8
            if (iosCheck.isIos8) {
                iOS8MultiTabFix();
            }
        });

        return {
            /**
             * global helper functions for the dom
             */
            getDimension: getDimension,
            /**
             * register a resize listener to the window resize event.
             */
            addResizeListener: addResizeListener
        };
    }());
    // export as module or bind to global
    if (typeof module !== 'undefined') {
        module.exports = cannyWindow;
    } else {
        canny.add('window', cannyWindow);
    }
}());
