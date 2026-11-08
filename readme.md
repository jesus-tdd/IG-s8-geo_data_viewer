# Densidad de Iglesias en Castilla y León (IG semana 8)

## Contenido
- [Demo](#demo)
- [Trabajo Realizado](#trabajo-realizado)
- [Créditos](#créditos)
- [Uso de IA](#uso-de-ia)

## Demo
![Vídeo pendiente](.)

## Trabajo Realizado
- Generación de un mapa de la densidad de centros religiosos católicos en la provincia de Castilla y León.
- Resolución variable de los datos.
- Cámara orbital.

### Mapa de Castilla y León

El mapa es una imagen en formato *jpg*.

Para mostrar el mapa, simplemente se crea un plano y se usa la imagen como textura.

### Datos

Los datos analizados se encuentran en un fichero *json* con los siguientes campos:
- `limites`: latitud y longitud mínimas y máximas de los datos
- `puntos`: lista de datos a procesar. Cada punto contiene la siguiente información:
  - `id`
  - `lon`: longitud del punto
  - `lat`: latitud del punto
  - `tipo`: tipo de centro religioso.

El fichero se ha obtenido haciendo una consulta a [overpass turbo](https://overpass-turbo.eu/):

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

El fichero resultante de esto ha sido posteriormente filtrado por un script de python,
eliminando datos irrelevantes para el trabajo.
El script utilizado no se incluye en la entrega.

### Presentación de los datos en el mapa

Los datos se presentan como barras tridimensionales con base cuadrada, 
agrupados en una `InstancedMesh`.

El espacio se divide en un número variable de columnas, y el número de filas depende de este.

Además, a cada barra se le aplica un color en función de su valor.

La latitud y longitud de los puntos se convierte a espacio de la escena
mediante la función `geoToScene()`.
Posteriormente, la posición es discretizada para asignarse a una de las barras del mapa.

No se dibujan barras en las posiciones del mapa sobre las que no caiga ningún punto.

### Iluminación

Toda la escena está iluminada por una luz ambiente
y una luz direccional. 


## Créditos
[d-maps.com](https://www.d-maps.com/carte.php?num_car=28469&lang=es)

[overpass turbo](https://overpass-turbo.eu/)


## Uso de IA

Se ha usado inteligencia artificial para la obtención de datos, 
tanto para la consulta en [overpass turbo](https://overpass-turbo.eu/)
como para desarrollar el script de filtrado.

Se ha usado inteligencia artificial para la generación de la paleta de colores utilizada.

Se ha usado inteligencia artificial para sobrescribir el estilo por defecto de `dat.gui`.

Se ha usado inteligencia artificial para agilizar la lectura de la documentación.