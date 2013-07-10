# -*- coding: utf-8 -*-
import sys

from django import forms
from django.db.models.query import QuerySet

from sortedm2m.widgets import SortedDragAndDropWidget


if sys.version_info[0] < 3:
    iteritems = lambda d: iter(d.iteritems())
    string_types = basestring,
    str_ = unicode
else:
    iteritems = lambda d: iter(d.items())
    string_types = str,
    str_ = str


class SortedMultipleChoiceField(forms.ModelMultipleChoiceField):
    widget = SortedDragAndDropWidget

    def clean(self, value):
        queryset = super(SortedMultipleChoiceField, self).clean(value)
        if value is None or not isinstance(queryset, QuerySet):
            return queryset
        object_list = dict((
            (str_(key), value)
            for key, value in iteritems(queryset.in_bulk(value))))
        return [object_list[str_(pk)] for pk in value]
