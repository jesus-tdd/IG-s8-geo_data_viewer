# Densidad de Iglesias en Castilla y León (IG semana 8)

## Datos fuente
Los datos se han obtenido de 
[overpass turbo](https://overpass-turbo.eu/).
Se ha realizado la siguiente consulta:

```overpassql
[out:json][timeout:300][maxsize:1073741824];
area["ISO3166-2"="ES-CL"]->.a;
(
  nwr["amenity"="place_of_worship"]["religion"="christian"]
     ["denomination"!~"protestant|evangelical|orthodox|baptist|pentecostal|adventist|anglican|lutheran|jehovahs_witness|mormon|methodist"]
     (area.a);
);
out center;
```

A partir de la consulta, se ha obtenido el fichero `export.geojson`.

Posteriormente, se ha filtrado el fichero mediante un script de python para dejar únicamente los datos relevantes para el trabajo:
- Identificador, latitud, longitud y tipo de cada punto obtenido
- Latitud y longitud mínimas y máximas

El script no se incluye en la entrega.

Se ha usado inteligencia artificial para la consulta de obtención de los datos y para el script de filtrado.