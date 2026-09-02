# Modificación del sistema de inventario y códigos de barras para carnicería

Necesito modificar el sistema actual de carnicería para implementar correctamente el manejo de productos vendidos por peso y productos empacados con diferentes pesos.

## Objetivo principal

Un producto debe existir como **un solo producto principal**, pero debe poder tener múltiples paquetes individuales asociados.

NO crear un producto diferente para cada paquete.

Ejemplo:

Producto principal:

* Nombre: Posta de Res
* Código/SKU: RES-001
* Unidad de inventario: LB
* Precio por libra: C$180

Este producto puede tener:

* Paquete 000001 → 2.35 lb
* Paquete 000002 → 1.80 lb
* Paquete 000003 → 3.10 lb
* Paquete 000004 → 2.75 lb

Todos pertenecen al mismo producto `RES-001`.

---

# 1. Productos principales

Mantener la tabla/módulo actual de productos.

Cada producto debe tener:

* ID
* SKU
* Código de barras principal
* Nombre
* Categoría
* Unidad de medida
* Precio de venta
* Precio por libra/kg cuando aplique
* Costo
* Stock actual
* Tipo de venta

Agregar, si no existe:

`tipo_venta`

Valores:

* PESO
* UNIDAD
* PAQUETE

Para productos de carnicería normalmente será `PESO` o `PAQUETE`.

Ejemplo:

```text
Producto:
Posta de Res

SKU:
RES-001

Código:
RES-001

Unidad:
LB

Precio por LB:
C$180
```

---

# 2. Crear módulo de paquetes

Crear una entidad/tabla independiente llamada `paquetes`.

Cada paquete representa una unidad física individual de producto.

Campos mínimos:

```text
id
producto_id
lote_id
sub_codigo
codigo_barras
peso
precio_por_unidad
precio_total
fecha_empaque
fecha_vencimiento
estado
```

El `producto_id` debe relacionar el paquete con el producto principal.

Ejemplo:

```text
Producto:
Posta de Res
ID: 15

Paquete:
ID: 4589
Producto ID: 15
Subcódigo: PAQ-0004589
Código de barras: 2000004589XXX
Peso: 2.35 LB
Precio/LB: C$180
Precio total: C$423
Estado: DISPONIBLE
```

---

# 3. Generación automática de subcódigo

Cuando el usuario cree un nuevo paquete, el sistema debe generar automáticamente un identificador único.

Ejemplo:

```text
PAQ-000001
PAQ-000002
PAQ-000003
PAQ-000004
```

El usuario NO debe escribir manualmente el subcódigo.

El código debe ser único en todo el sistema.

---

# 4. Código de barras del paquete

Cada paquete debe tener un código de barras único.

El código de barras debe identificar específicamente ese paquete.

Ejemplo:

```text
Producto:
RES-001

Paquete:
PAQ-000001

Código de barras:
200000000001
```

Otro paquete:

```text
Producto:
RES-001

Paquete:
PAQ-000002

Código de barras:
200000000002
```

Los dos códigos pertenecen al mismo producto, pero representan paquetes físicos diferentes.

Usar una estructura que permita generar códigos únicos y compatibles con el lector de códigos de barras.

Preferiblemente utilizar Code 128 para códigos internos de paquetes, salvo que el sistema/impresora actual requiera otro estándar.

---

# 5. Impresión de etiquetas

Al crear un paquete debe existir una opción:

`Imprimir etiqueta`

La etiqueta debe mostrar como mínimo:

```text
NOMBRE DEL PRODUCTO

2.35 LB

C$423.00

Fecha de empaque: 30/08/2026

Código de barras

PAQ-000001
```

El código de barras debe corresponder al paquete específico.

El sistema debe utilizar la impresora de etiquetas que ya está configurada en el proyecto.

No modificar la integración actual de impresión si ya funciona correctamente; adaptar únicamente los datos que se imprimen.

---

# 6. Escaneo en el POS

Modificar el POS para que al escanear un código pueda detectar automáticamente qué tipo de código es.

Flujo:

```text
ESCANEAR CÓDIGO
       ↓
BUSCAR EN PRODUCTOS
       ↓
¿EXISTE?
 ┌─────┴─────┐
 SI          NO
 ↓            ↓
PRODUCTO   BUSCAR EN PAQUETES
              ↓
          ¿EXISTE?
          ┌───┴───┐
          SI      NO
          ↓        ↓
       PAQUETE   CÓDIGO
       VÁLIDO    NO ENCONTRADO
```

## Si es un producto

Ejemplo:

```text
RES-001
```

El sistema encuentra:

```text
Posta de Res
```

Como es un producto vendido por peso, debe solicitar el peso mediante la balanza o permitir introducirlo manualmente según la funcionalidad existente.

Ejemplo:

```text
Posta de Res
Peso: 2.50 LB
Precio/LB: C$180
Total: C$450
```

---

## Si es un paquete

Ejemplo:

```text
200000000001
```

El sistema debe encontrar automáticamente:

```text
Paquete: PAQ-000001
Producto: Posta de Res
Peso: 2.35 LB
Precio: C$423
Estado: DISPONIBLE
```

Agregar automáticamente el paquete al carrito.

NO pedir nuevamente el peso.

NO pedir seleccionar el producto.

NO crear otro producto.

---

# 7. Estado del paquete

Cada paquete debe tener estado.

Valores:

```text
DISPONIBLE
VENDIDO
ANULADO
DEVUELTO
MERMA
```

Regla importante:

Un paquete con estado `VENDIDO`, `ANULADO` o `MERMA` no debe poder venderse nuevamente.

Si se intenta escanear:

```text
200000000001
```

y ya está vendido, mostrar:

```text
Paquete ya vendido

Producto: Posta de Res
Peso: 2.35 LB
Venta: #000458
Fecha: 30/08/2026
```

No agregarlo al carrito.

---

# 8. Descuento de inventario

El inventario principal debe manejarse por peso.

Ejemplo:

```text
Posta de Res
Stock: 100 LB
```

Se empacan:

```text
Paquete 1 → 2.35 LB
Paquete 2 → 1.80 LB
Paquete 3 → 3.10 LB
```

Al vender el paquete 1:

```text
Stock anterior: 100 LB
Venta: -2.35 LB
Stock nuevo: 97.65 LB
```

Además:

```text
Paquete 1
DISPONIBLE → VENDIDO
```

---

# 9. No descontar dos veces

Esto es MUY importante.

Cuando se crea un paquete a partir de producto disponible, definir correctamente cómo se mueve el inventario.

No permitir:

```text
Crear paquete -2.35 LB
+
Vender paquete -2.35 LB
=
-4.70 LB
```

El sistema debe tener una única lógica de inventario.

Recomiendo manejar:

```text
Stock total
Stock a granel
Stock empacado
```

Ejemplo:

```text
Posta de Res

Stock total:       50.00 LB
Stock empacado:    20.00 LB
Stock a granel:    30.00 LB
```

Cuando se transforma producto a paquete:

```text
Stock a granel:    -2.35 LB
Stock empacado:    +2.35 LB
Stock total:        0 LB de cambio
```

Cuando se vende:

```text
Stock empacado:    -2.35 LB
Stock total:       -2.35 LB
```

Esto evita duplicar descuentos.

---

# 10. Recepción de cajas

Cuando llega mercancía en cajas, NO crear un producto por caja.

Ejemplo:

```text
Producto: Posta de Res

Caja:
CAJA-000125

Peso recibido:
50.00 LB

Lote:
LOTE-20260830-001
```

La caja debe quedar asociada al lote.

Después se pueden generar paquetes:

```text
CAJA-000125
      ↓
LOTE-20260830-001
      ↓
Posta de Res
      ↓
Paquetes
```

---

# 11. Lotes y trazabilidad

Cada paquete debe conservar la relación:

```text
Paquete
   ↓
Producto
   ↓
Lote
   ↓
Compra/entrada
```

Así posteriormente se puede saber de qué caja/lote salió un paquete vendido.

Ejemplo:

```text
PAQ-0004589
Producto: Posta de Res
Lote: LOTE-20260830-001
Caja: CAJA-000125
Peso: 2.35 LB
```

---

# 12. Mermas

Crear una opción para registrar merma.

Ejemplo:

```text
Producto: Posta de Res
Peso: 1.20 LB
Motivo: Recorte / producto dañado
```

El sistema debe registrar:

```text
MERMA
-1.20 LB
```

Y permitir indicar el lote correspondiente.

Si la merma corresponde a un paquete específico, cambiar:

```text
DISPONIBLE → MERMA
```

---

# 13. Ventas

En una venta deben poder coexistir:

### Producto vendido por peso

```text
Posta de Res
3.50 LB × C$180
C$630
```

### Paquete previamente empacado

```text
Posta de Res
PAQ-0004589
2.35 LB
C$423
```

### Productos normales por unidad

```text
Coca Cola
2 × C$40
C$80
```

El carrito debe soportar los tres tipos.

---

# 14. Devoluciones

Si se devuelve un paquete vendido, no crear uno nuevo.

Cambiar:

```text
VENDIDO → DEVUELTO
```

y generar el movimiento de inventario correspondiente.

Si el paquete vuelve a estar disponible para venta:

```text
DEVUELTO → DISPONIBLE
```

Si no puede volver a venderse:

```text
DEVUELTO → MERMA
```

según las reglas del negocio.

---

# 15. Historial de movimientos

Crear o adaptar el módulo de movimientos de inventario para registrar:

```text
ENTRADA
EMPAQUETADO
VENTA
DEVOLUCIÓN
MERMA
AJUSTE
```

Cada movimiento debe guardar:

```text
fecha
producto
cantidad/peso
tipo_movimiento
lote
paquete
usuario
referencia
```

Ejemplo:

```text
30/08/2026
VENTA
Posta de Res
-2.35 LB
Paquete: PAQ-0004589
Venta: #000123
Usuario: Cajero1
```

---

# 16. Búsqueda inteligente del código

La función de escaneo debe centralizarse en una sola función.

Conceptualmente:

```text
procesarCodigo(codigo)
```

Debe:

1. Buscar código en productos.
2. Si existe, procesar como producto.
3. Si no existe, buscar código en paquetes.
4. Si existe, procesar como paquete.
5. Si no existe en ninguno, mostrar "Código no encontrado".

No duplicar esta lógica en diferentes pantallas.

---

# 17. Importante para productos existentes

No romper los productos ni ventas existentes.

Antes de modificar la base de datos:

* Revisar estructura actual.
* Identificar tabla de productos.
* Identificar tabla de inventario.
* Identificar tabla de ventas.
* Identificar detalles de venta.
* Identificar sistema actual de códigos de barras.
* Identificar sistema actual de impresión.

Crear las nuevas tablas/campos mediante migraciones.

No eliminar datos existentes.

Los productos actuales deben seguir funcionando.

---

# 18. Interfaz de usuario

En la pantalla de productos agregar una opción:

`Ver paquetes`

Ejemplo:

```text
POSTA DE RES
RES-001

Stock total: 125.40 LB

Paquetes disponibles: 32
Peso empacado: 68.40 LB
Peso a granel: 57.00 LB

[Ver paquetes]
[Empacar producto]
```

En `Ver paquetes`:

```text
Código       Peso      Precio      Estado
------------------------------------------------
PAQ-000001   2.35 LB   C$423       DISPONIBLE
PAQ-000002   1.80 LB   C$324       VENDIDO
PAQ-000003   3.10 LB   C$558       DISPONIBLE
```

---

# 19. Pantalla para empacar

Crear una pantalla:

`Inventario → Empaquetar`

Flujo:

```text
Seleccionar producto
        ↓
Seleccionar lote
        ↓
Ingresar/pesar producto
        ↓
Peso del paquete
        ↓
Generar subcódigo
        ↓
Generar código de barras
        ↓
Guardar paquete
        ↓
Imprimir etiqueta
```

Debe existir opción para:

`[Guardar e imprimir]`

y

`[Guardar sin imprimir]`

---

# 20. Resultado esperado

El sistema final debe funcionar así:

```text
PRODUCTO
Posta de Res
RES-001
        │
        ├── PAQ-000001
        │   2.35 LB
        │   Código único
        │
        ├── PAQ-000002
        │   1.80 LB
        │   Código único
        │
        ├── PAQ-000003
        │   3.10 LB
        │   Código único
        │
        └── PAQ-000004
            2.75 LB
            Código único
```

El cajero puede escanear tanto:

```text
RES-001
```

como:

```text
código del paquete
```

y el sistema debe detectar automáticamente qué es.

**Regla fundamental:**

> Un producto = un producto en el catálogo.

> Un paquete = una existencia física individual asociada al producto.

> El código de barras del producto identifica el producto.

> El código de barras del paquete identifica el paquete específico.

> El inventario se controla por peso.

> Una venta de paquete descuenta exactamente el peso de ese paquete.

Antes de comenzar a programar, analiza la estructura actual del proyecto y adapta esta solución a las tablas, componentes, API y flujo de POS existentes. No reemplaces funcionalidades que ya funcionan y no dupliques módulos innecesariamente.
