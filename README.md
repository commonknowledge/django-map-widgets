### This is a fork!

This is a fork of https://github.com/erdem/django-map-widgets that provides a Mapbox Point Field Widget, styled for use with the Wagtail CMS.

![](https://media3.giphy.com/media/jpwHd9vcRLKWpEuw8Z/giphy.gif?cid=790b7611af290c6cc222a8764294afbcc7c6fce73b2d843a&rid=giphy.gif&ct=g)

### Django Map Widgets
Configurable, pluggable and more user friendly map widgets for Django PostGIS fields.

* **Documentation**: <a href="http://django-map-widgets.readthedocs.io/" target="_blank">http://django-map-widgets.readthedocs.io/</a>
* **Project Home Page**: <a href="https://github.com/erdem/django-map-widgets">https://github.com/erdem/django-map-widgets/</a>

### Achievements
The aim of the Django map widgets is to make all Geo Django widgets more user friendly and configurable. Map widgets are currently supporting only Google Map services, but we are planning to add other major map services.

### Installation

    pip install django-map-widgets


Add ‘map_widgets’ to your `INSTALLED_APPS` in settings.py

```python
INSTALLED_APPS = [
     ...
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'mapwidgets',
]
```

Collects the static files into `STATIC_ROOT`.

```bash
python manage.py collectstatic
```

**Django Admin**

```python
from django.contrib.gis.db import models
from mapwidgets.widgets import MapboxPointFieldWidget

class CityAdmin(admin.ModelAdmin):
    formfield_overrides = {
        models.PointField: { "widget": MapboxPointFieldWidget }
    }
```

**Django Forms**

```python
from mapwidgets.widgets import MapboxPointFieldWidget

class CityForm(forms.ModelForm):
    class Meta:
        model = City
        fields = ("coordinates", "city_hall")
        widgets = {
            'coordinates': MapboxPointFieldWidget
        }
```

...and your template should look something like this

```html
<form method="POST" action="">
    {% csrf_token %}
    {{form.media}}
    {{form.as_p}}
</form>
```