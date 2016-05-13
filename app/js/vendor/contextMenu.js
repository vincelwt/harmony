angular.module('ui.bootstrap.contextMenu', [])

.service('CustomService', function () {
    "use strict";

    return {
        initialize: function (item) {
            console.log("got here", item);
        }
    }

})
.directive('contextMenu', ["$parse", "$q", "CustomService", "$sce", function ($parse, $q, custom, $sce) {

    var contextMenus = [];
    var $currentContextMenu = null;
    var defaultItemText = "New Item";

    var removeContextMenus = function (level) {
        /// <summary>Remove context menu.</summary>
        while (contextMenus.length && (!level || contextMenus.length > level)) {
            contextMenus.pop().remove();
        }
        if (contextMenus.length == 0 && $currentContextMenu) {
            $currentContextMenu.remove();
        }
    };


    var processTextItem = function ($scope, item, text, event, model, $promises, nestedMenu, $) {
        "use strict";

        var $a = $('<a>');
        $a.css("padding-right", "8px");
        $a.attr({ tabindex: '-1', href: '#' });

        if (typeof item[0] === 'string') {
            text = item[0];
        }
        else if (typeof item[0] === "function") {
            text = item[0].call($scope, $scope, event, model);
        } else if (typeof item.text !== "undefined") {
            text = item.text;
        }

        var $promise = $q.when(text);
        $promises.push($promise);
        $promise.then(function (text) {
            if (nestedMenu) {
                $a.css("cursor", "default");
                $a.append($('<strong style="font-family:monospace;font-weight:bold;float:right;">&gt;</strong>'));
            }
            $a.append(text);
        });

        return $a;

    };

    var processItem = function ($scope, event, model, item, $ul, $li, $promises, $q, $, level) {
        /// <summary>Process individual item</summary>
        "use strict";
        // nestedMenu is either an Array or a Promise that will return that array.
        var nestedMenu = angular.isArray(item[1]) || (item[1] && angular.isFunction(item[1].then))
          ? item[1] : angular.isArray(item[2]) || (item[2] && angular.isFunction(item[2].then))
          ? item[2] : angular.isArray(item[3]) || (item[3] && angular.isFunction(item[3].then))
          ? item[3] : null;

        // if html property is not defined, fallback to text, otherwise use default text
        // if first item in the item array is a function then invoke .call()
        // if first item is a string, then text should be the string.

        var text = defaultItemText;
        if (typeof item[0] === 'function' || typeof item[0] === 'string' || typeof item.text !== "undefined") {
            text = processTextItem($scope, item, text, event, model, $promises, nestedMenu, $);
        }
        else if (typeof item.html !== "undefined") {
            // leave styling open to dev
            text = item.html
        }

        $li.append(text);




        // if item is object, and has enabled prop invoke the prop
        // els if fallback to item[2]

        var isEnabled = function () {
            if (typeof item.enabled !== "undefined") {
                return item.enabled.call($scope, $scope, event, model, text);
            } else if (typeof item[2] === "function") {
                return item[2].call($scope, $scope, event, model, text);
            } else {
                return true;
            }
        };

        registerEnabledEvents($scope, isEnabled(), item, $ul, $li, nestedMenu, model, text, event, $, level);
    };

    var handlePromises = function ($ul, level, event, $promises) {
        /// <summary>
        /// calculate if drop down menu would go out of screen at left or bottom
        /// calculation need to be done after element has been added (and all texts are set; thus thepromises)
        /// to the DOM the get the actual height
        /// </summary>
        "use strict";
        $q.all($promises).then(function () {
            var topCoordinate = event.pageY;
            var menuHeight = angular.element($ul[0]).prop('offsetHeight');
            var winHeight = event.view.innerHeight;
            if (topCoordinate > menuHeight && winHeight - topCoordinate < menuHeight) {
                topCoordinate = event.pageY - menuHeight;
            } else if(winHeight <= menuHeight) {
                // If it really can't fit, reset the height of the menu to one that will fit
                angular.element($ul[0]).css({"height": winHeight - 5, "overflow-y": "scroll"});
                // ...then set the topCoordinate height to 0 so the menu starts from the top
                topCoordinate = 0;
            } else if(winHeight - topCoordinate < menuHeight) {
                var reduceThreshold = 5;
                if(topCoordinate < reduceThreshold) {
                    reduceThreshold = topCoordinate;
                }
                topCoordinate = winHeight - menuHeight - reduceThreshold;
            }

            var leftCoordinate = event.pageX;
            var menuWidth = angular.element($ul[0]).prop('offsetWidth');
            var winWidth = event.view.innerWidth;
            if (leftCoordinate > menuWidth && winWidth - leftCoordinate < menuWidth) {
                leftCoordinate = event.pageX - menuWidth;
            }

            $ul.css({
                display: 'block',
                position: 'absolute',
                left: leftCoordinate + 'px',
                top: topCoordinate + 'px'
            });
        });

    };

    var registerEnabledEvents = function ($scope, enabled, item, $ul, $li, nestedMenu, model, text, event, $, level) {
        /// <summary>If item is enabled, register various mouse events.</summary>
        if (enabled) {
            var openNestedMenu = function ($event) {
                removeContextMenus(level + 1);
                /*
                 * The object here needs to be constructed and filled with data
                 * on an "as needed" basis. Copying the data from event directly
                 * or cloning the event results in unpredictable behavior.
                 */
                var ev = {
                    pageX: event.pageX + $ul[0].offsetWidth - 1,
                    pageY: $ul[0].offsetTop + $li[0].offsetTop - 3,
                    view: event.view || window
                };

                /*
                 * At this point, nestedMenu can only either be an Array or a promise.
                 * Regardless, passing them to when makes the implementation singular.
                 */
                $q.when(nestedMenu).then(function(promisedNestedMenu) {
                    renderContextMenu($scope, ev, promisedNestedMenu, model, level + 1);
                });
            };

            $li.on('click', function ($event) {
                $event.preventDefault();
                $scope.$apply(function () {
                    if (nestedMenu) {
                        openNestedMenu($event);
                    } else {
                        $(event.currentTarget).removeClass('context');
                        removeContextMenus();

                        if (angular.isFunction(item[1])) {
                            item[1].call($scope, $scope, event, model, text)
                        } else {
                            item.click.call($scope, $scope, event, model, text);
                        }
                    }
                });
            });

            $li.on('mouseover', function ($event) {
                $scope.$apply(function () {
                    if (nestedMenu) {
                        openNestedMenu($event);
                    }
                });
            });
        } else {
            $li.on('click', function ($event) {
                $event.preventDefault();
            });
            $li.addClass('disabled');
        }

    };


    var renderContextMenu = function ($scope, event, options, model, level) {
        /// <summary>Render context menu recursively.</summary>
        if (!level) { level = 0; }
        if (!$) { var $ = angular.element; }
        $(event.currentTarget).addClass('context');
        var $contextMenu = $('<div>');
        if ($currentContextMenu) {
            $contextMenu = $currentContextMenu;
        } else {
            $currentContextMenu = $contextMenu;
            $contextMenu.addClass('angular-bootstrap-contextmenu dropdown clearfix');
        }
        var $ul = $('<ul>');
        $ul.addClass('dropdown-menu');
        $ul.attr({ 'role': 'menu' });
        $ul.css({
            display: 'block',
            position: 'absolute',
            left: event.pageX + 'px',
            top: event.pageY + 'px',
            "z-index": 10000
        });

        var $promises = [];

        angular.forEach(options, function (item) {

            var $li = $('<li>');
            if (item === null) {
                $li.addClass('divider');
            } else if (typeof item[0] === "object") {
                custom.initialize($li, item);
            } else {
                processItem($scope, event, model, item, $ul, $li, $promises, $q, $, level);
            }
            $ul.append($li);
        });
        $contextMenu.append($ul);
        var height = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        $contextMenu.css({
            width: '100%',
            height: height + 'px',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 9999
        });
        $(document).find('body').append($contextMenu);

        handlePromises($ul, level, event, $promises);

        $contextMenu.on("mousedown", function (e) {
            if ($(e.target).hasClass('dropdown')) {
                $(event.currentTarget).removeClass('context');
                removeContextMenus();
            }
        }).on('contextmenu', function (event) {
            $(event.currentTarget).removeClass('context');
            event.preventDefault();
            removeContextMenus(level);
        });

        $scope.$on("$destroy", function () {
            removeContextMenus();
        });

        contextMenus.push($ul);
    };
    return function ($scope, element, attrs) {
        element.on('contextmenu', function (event) {
            event.stopPropagation();
            $scope.$apply(function () {
                event.preventDefault();
                var options = $scope.$eval(attrs.contextMenu);
                var model = $scope.$eval(attrs.model);
                if (options instanceof Array) {
                    if (options.length === 0) { return; }
                    renderContextMenu($scope, event, options, model);
                } else {
                    throw '"' + attrs.contextMenu + '" not an array';
                }
            });
        });
    };
}]);
