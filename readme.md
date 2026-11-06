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