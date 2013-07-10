import sys
from itertools import chain

from django import forms
from django.conf import settings
from django.forms.util import flatatt
from django.utils.encoding import force_unicode
from django.template import Context, Template
from django.utils.safestring import mark_safe

if sys.version_info[0] < 3:
    iteritems = lambda d: iter(d.iteritems())
    string_types = basestring,
    str_ = unicode
else:
    iteritems = lambda d: iter(d.items())
    string_types = str,
    str_ = str

STATIC_URL = getattr(settings, 'STATIC_URL', settings.MEDIA_URL)


class SortedDragAndDropWidget(forms.Widget):
    class Media:
        js = (
            'http://code.jquery.com/jquery-1.9.1.js',
            'http://code.jquery.com/ui/1.10.3/jquery-ui.js',
            STATIC_URL + 'sortedm2m/sortable.js',
        )
        css = {'screen': (
            STATIC_URL + 'sortedm2m/widget.css',
        )}

    def __init__(self, attrs=None, choices=()):
        super(SortedDragAndDropWidget, self).__init__(attrs)
        self.choices = list(choices)

    def build_attrs(self, attrs=None, **kwargs):
        attrs = super(SortedDragAndDropWidget, self).build_attrs(attrs, **kwargs)
        classes = attrs.setdefault('class', '').split()
        classes.append('sortedm2m')
        attrs['class'] = ' '.join(classes)
        return attrs

    def render(self, name, value, attrs=None, choices=()):
        if value is None:
            value = ''
        final_attrs = self.build_attrs(attrs, name=name)

        str_values = set([force_unicode(v) for v in value])
        context = self.render_list_items(choices, str_values)
        context['attrs'] = mark_safe(flatatt(final_attrs))

        # reorder the selected bits
        ordered = []
        for value in value:
            for selected in context['selected']:
                if force_unicode(value) == selected['id']:
                    ordered.append(selected)
        context['selected'] = ordered

        template = """
        <div class="selector">
        <div class="selector-available">
        <h2>Available</h2>
        <ul {{ attrs }}>
        {% for choice in unselected %}
            <li data-photo-id="{{ choice.id }}">{{ choice.label }}</li>
        {% endfor %}
        </ul>
        </div>

        <div class='selector-chosen'>
        <h2>Selected</h2>
        <ul>
        {% for choice in selected %}
            <li data-photo-id="{{ choice.id }}">{{ choice.label }}</li>
        {% endfor %}
        </ul>
        </div>
        </div>
        """
        html = Template(template).render(Context(context))
        return mark_safe(html)

    def render_list_items(self, choices, selected_choices):
        selected = []
        unselected = []

        for choice_value, label in chain(self.choices, choices):
            choice_value = force_unicode(choice_value)
            if choice_value in selected_choices:
                choice_dict = {'label': force_unicode(label), 'id': choice_value}
                selected.append(choice_dict)
            else:
                choice_dict = {'label': force_unicode(label), 'id': choice_value}
                unselected.append(choice_dict)
        return {'selected': selected, 'unselected': unselected}

    def value_from_datadict(self, data, files, name):
        value = data.get(name, None)
        if isinstance(value, string_types):
            return [v for v in value.split(',') if v]
        return value
