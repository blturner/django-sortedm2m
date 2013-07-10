if (jQuery === undefined) {
    jQuery = django.jQuery;
}

(function ($) {
    $(document).ready(function () {
        $('.sortedm2m').each(function(i) {
            var sortable = SortableFilterWidget({id: i});
        });

        if (window.showAddAnotherPopup) {
            var django_dismissAddAnotherPopup = window.dismissAddAnotherPopup;
            window.dismissAddAnotherPopup = function (win, newId, newRepr) {
                // newId and newRepr are expected to have previously been escaped by
                // django.utils.html.escape.
                newId = html_unescape(newId);
                newRepr = html_unescape(newRepr);
                var name = windowname_to_id(win.name);
                var elem = $('#' + name);
                var sortedm2m = elem.siblings('ul.sortedm2m');
                if (sortedm2m.length == 0) {
                    // no sortedm2m widget, fall back to django's default
                    // behaviour
                    return django_dismissAddAnotherPopup.apply(this, arguments);
                }

                if (elem.val().length > 0) {
                    elem.val(elem.val() + ',');
                }
                elem.val(elem.val() + newId);

                var id_template = '';
                var maxid = 0;
                sortedm2m.find('li input').each(function () {
                    var match = this.id.match(/^(.+)_(\d+)$/);
                    id_template = match[1];
                    id = parseInt(match[2]);
                    if (id > maxid) maxid = id;
                });

                var id = id_template + '_' + (maxid + 1);
                var new_li = $('<li/>').append(
                    $('<label/>').attr('for', id).append(
                        $('<input class="sortedm2m" type="checkbox" checked="checked" />').attr('id', id).val(newId)
                    ).append($('<span/>').text(' ' + newRepr))
                );
                sortedm2m.append(new_li);

                win.close();
            };
        }
    });
})(jQuery);

var SortableFilterWidget = (function ($) {
    var Widget = function (options) {
        var defaults = {
            id: 0,
            selector: '.sortedm2m'
        },

        self = this,
        settings = $.extend({}, defaults, options);

        this.$node = $(settings.selector);
        this.$parent = this.$node.parent().parent();
        this.$available = this.$parent.find('.selector-available');
        this.$chosen = this.$parent.find('.selector-chosen');

        var inputId = this.$node.attr('id') + '_' + settings.id,
            inputName = this.$node.attr('name');

        this.getName = function () {
            return inputName;
        };

        function removeElem(event, ui) {
            ui.item[0].remove();
        }

        function buildLink(class_string, text) {
            return '<a href="#" class="' + class_string + '">' + text + '</a>';
        }

        function addChooseAll() {
            self.$available.append(buildLink('selector-chooseall', 'Choose all'));
        }

        function addRemoveAll() {
            self.$chosen.append(buildLink('selector-clearall', 'Remove all'));
        }

        function addInput() {
            self.$parent.before('<input type="hidden" id="' + inputId + '" name="' + inputName + '" />');
        }

        function addRemoveLink() {
            self.$chosen.find('li').each(function () {
                $(this).find('.deletelink').remove();
                // $(this).append(' <a href="#" class="remove deletelink">Remove</a>');
                $(this).append(buildLink('deletelink', 'Remove'));
            });

            self.$chosen.find('.deletelink').on('click', function () {
                $(this).trigger({
                    type: 'selectremove',
                    el: $(this).parent()
                });
            });
        }

        function chooseOrRemoveAll(from_selector, to_selector) {
            var to_box = self.$parent.find(to_selector);
            self.$parent.find(from_selector).each(function () {
                to_box.append(this);
            });
            updateInput();
            addRemoveLink();
            setupDraggable();
            self.$parent.trigger('selectupdate');
        }

        function updatelinks() {
            checkIfActive('.selector-chooseall', '.selector-available li');
            checkIfActive('.selector-clearall', '.selector-chosen li');
        }

        function checkIfActive(selector, containerSelector) {
            var activeClass = 'active',
                $activeLink = self.$parent.find(selector);
            $activeLink.removeClass(activeClass);
            if ($(containerSelector).length > 0) {
                $activeLink.addClass('active');
            }
        }

        function setupDraggable() {
            var options = {
                containment: self.$parent,
                connectToSortable: '.selector-chosen ul',
                cursor: 'move',
                helper: 'clone'
            };

            try {
                self.$node.find('li').draggable('destroy').draggable(options);
            } catch (e) {
                self.$node.find('li').draggable(options);
            }

            self.$parent.trigger('selectavailable');
        }

        function updateInput() {
            var $input = $('#' + inputId),
                values = [];
            self.$parent.find('.selector-chosen li').each(function() {
                values.push($(this).attr('data-photo-id'));
            });
            $input.val(values.join(','));
        }

        this.remove = function(e, ui) {
            removeElem(e, ui);
        };

        this.chooseAll = function () {
            chooseOrRemoveAll('.selector-available li', '.selector-chosen ul');
        };

        this.removeAll = function () {
            chooseOrRemoveAll('.selector-chosen li', '.selector-available ul');
        };

        this.$parent.on('sortreceive', this.remove);
        this.$parent.on('sortreceive', addRemoveLink);
        this.$parent.on('sortreceive sortupdate', updateInput);
        this.$parent.on('sortreceive selectupdate selectavailable', updatelinks);

        this.$parent.on('selectremove', function (e, ui) {
            $(e.el).find('.remove').remove();
            self.$node.append(e.el);
            updateInput();
            setupDraggable();
        });

        addInput();
        addRemoveLink();
        setupDraggable();
        updateInput();
        addChooseAll();
        addRemoveAll();

        this.init();
    };

    var proto = Widget.prototype;

    proto.init = function () {
        var name = this.getName();

        $('.selector-chooseall').on('click', this.chooseAll);
        $('.selector-clearall').on('click', this.removeAll);

        this.$parent.trigger('selectupdate');

        this.$available.find('h2').text(function () {
            return this.innerText + ' ' + name;
        });

        this.$chosen.find('h2').text(function () {
            return this.innerText + ' ' + name;
        });

        this.$chosen.find('ul').sortable({
            axis: 'y',
            helper: 'clone',
            placeholder: 'ui-state-highlight',
            opacity: 0.5
        });
    };

    function new_widget(node) {
        s = new Widget(node);
        s.cons = Widget;
        return s;
    }

    return new_widget;
})(jQuery);
