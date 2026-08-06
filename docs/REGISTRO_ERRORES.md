

## Tabla de errores

| N° | Archivo | Problema encontrado | Cómo lo detecté | Solución aplicada |
|---|---------|---------------------|-----------------|-------------------|
| 1 | src/app.js | Faltaba el middleware `express.json()`, así que `req.body` llegaba `undefined` y register/login tiraban 500. | Al probar `POST /register` el server respondía 500 con "Cannot destructure property 'name' of req.body as it is undefined". | Agregué `app.use(express.json())` antes de montar los routers para que Express lea el cuerpo JSON. |
| 2 | src/app.js | El router de autenticación estaba montado en `/api/loginn` (con doble "n"), así que las rutas reales no existían en el path esperado. | Pegando a `/api/login/...` me daba 404; revisando `app.js` vi el typo "loginn". | Cambié el prefijo a `/api/auth`, quedando `/api/auth/register` y `/api/auth/login`. |
| 3 | src/utils/token.js | Estaba escrito `module.export` (sin la "s"), entonces `signToken` no se exportaba y quedaba `undefined`. | Al llamar `signToken` en el controller reventaba; leyendo el archivo vi el `module.export` mal escrito. | Lo corregí a `module.exports`. |
| 4 | src/utils/token.js | El token se firmaba leyendo `process.env.JWT_SECRETT` (doble "T"), una variable que no existe. | Comparé el nombre con el `.env` (que tiene `JWT_SECRET`) y vi que no coincidían. | Usé `process.env.JWT_SECRET`, el nombre real de la variable. |
| 5 | src/utils/token.js | El token expiraba en 2 segundos (`expiresIn: "2s"`), quedaba inválido casi al instante. | Vi el valor `"2s"` al leer el `signToken`. | Le puse una duración útil de `"1h"`. |
| 6 | src/utils/token.js | El token no incluía el `id` del usuario en su contenido, pero las rutas protegidas lo necesitan. | En `/me` el controller usaba `req.user.id` y venía `undefined`. | Agregué `id` al payload: `{ id: user.id, role: user.role }`. |
| 7 | src/routes/userRoutes.js | En `GET /me` el orden de los middlewares estaba invertido: corría el handler antes de autenticar. | Vi `router.get("/me", getProfile, authMiddleware)` y que `/me` crasheaba sin token. | Puse primero el middleware: `authMiddleware, getProfile`. |
| 8 | src/middleware/authMiddleware.js | El token se leía con `jwt.decode`, que no valida la firma ni el vencimiento: cualquier token falso pasaba. | Con un token inventado la ruta protegida igual respondía OK. | Reemplacé por `jwt.verify(...)` dentro de un try/catch. |
| 9 | src/middleware/authMiddleware.js | La condición `(!token \|\| decoded)` dejaba pasar a todos (incluso sin token, como "guest"). | Sin mandar token, la ruta protegida no me frenaba. | Reescribí la lógica: sin token o token inválido corta; solo pasa si `verify` es válido. |
| 10 | src/middleware/authMiddleware.js | Para token faltante o inválido devolvía 403 en lugar de 401. | Vi el `res.status(403)` y lo comparé con lo que pide la consigna. | Cambié la respuesta a 401 (no autenticado). |
| 11 | src/controllers/authController.js | En register, al faltar datos respondía 400 pero sin `return`, así que seguía ejecutando. | Leyendo el código vi que después del 400 continuaba con el resto del handler. | Agregué `return` en la respuesta 400. |
| 12 | src/controllers/authController.js | Registrar un email ya existente devolvía 200 (éxito) en vez de un error de validación. | Repetí un register y me daba 200 con "Usuario ya registrado". | Lo cambié a 400. |
| 13 | src/controllers/authController.js | En login, un email inexistente respondía 200 y sin `return`, y después crasheaba al comparar contra un usuario `null`. | Con un email que no existe el server tiraba 500 ("Cannot read properties of null"). | Devuelvo 401 con `return` cuando el usuario no existe. |
| 14 | src/controllers/authController.js | `bcrypt.compare` tenía los argumentos invertidos: pasaba `(hash, password)` en vez de `(password, hash)`, así que el login nunca coincidía. | Con la contraseña correcta igual daba credenciales inválidas. | Lo di vuelta: `bcrypt.compare(password, user.password)`. |
| 15 | src/controllers/authController.js | En login, cuando la contraseña era incorrecta respondía 401 pero sin `return`, y seguía firmando y mandando el token igual. | Revisando el flujo vi que después del 401 no cortaba. | Agregué `return` en la respuesta 401. |
| 16 | src/routes/adminRoutes.js | `GET /all` listaba todos los usuarios sin exigir token, quedando abierto a cualquiera. | Sin token me devolvía la lista completa de usuarios. | Le apliqué el mismo `authMiddleware` que usan las demás rutas protegidas. |
| 17 | src/routes/userRoutes.js | `GET /orders` devolvía datos de un usuario sin pedir autenticación, a diferencia de `/me`. | Sin token me devolvía los pedidos igual. | Le agregué `authMiddleware` para ser consistente con el resto. |
| 18 | src/controllers/userController.js | En `updateMe` el id se tomaba de `req.body.userId`, permitiendo editar el perfil de otro usuario (IDOR). | Vi que el id salía del body en vez del token. | Uso siempre `req.user.id` (el del token), ignorando cualquier `userId` del body. |
| 19 | src/controllers/authController.js, userController.js, adminController.js | Las respuestas devolvían el hash de la contraseña del usuario. | En register/login/`/all` la respuesta traía el campo `password`. | Armo la respuesta sin ese campo (saco `password` antes de responder). |

## Explicación técnica (según la guía de calidad del TP)

Para los errores más importantes explico qué ocurría, por qué ocurría, cómo lo
solucioné y cómo validé que quedó funcionando.

### Autenticación JWT (errores 3, 4, 6, 8, 9, 10)
- **Qué ocurría:** las rutas protegidas no protegían nada (un token inventado
  entraba) o directamente crasheaban.
- **Por qué:** el módulo del token no se exportaba (`module.export`), se firmaba
  con una variable de entorno inexistente, el payload no llevaba el `id`, y el
  middleware usaba `jwt.decode` (que solo desarma el token, no valida la firma)
  con una condición que dejaba pasar a cualquiera.
- **Cómo lo solucioné:** corregí `module.exports` y el nombre `JWT_SECRET`,
  agregué el `id` al payload, y reescribí el middleware para usar
  `jwt.verify(...)` en un try/catch, cortando con 401 si no hay token o es
  inválido.
- **Cómo lo validé:** sin token → 401, con token inventado → 401, con token
  válido → 200 y me devuelve mi perfil.

### Login (errores 11 a 15)
- **Qué ocurría:** el login nunca funcionaba con la contraseña correcta y podía
  tirar 500 con un email inexistente.
- **Por qué:** `bcrypt.compare` tenía los argumentos al revés, varios `if` de
  error respondían pero no cortaban con `return` (seguían ejecutando y mandaban
  una segunda respuesta), y algunos usaban códigos HTTP equivocados (200 en
  casos de error).
- **Cómo lo solucioné:** invertí los argumentos de `bcrypt.compare`, agregué los
  `return` faltantes y ajusté los códigos a 400/401 según corresponde.
- **Cómo lo validé:** login correcto → 200 + token; contraseña mala → 401; email
  inexistente → 401 (ya no rompe).

### Rutas y middlewares globales (errores 1, 2, 7, 16, 17)
- **Qué ocurría:** register/login tiraban 500, el path de auth no existía, y
  había rutas con datos de usuario abiertas sin autenticación.
- **Por qué:** faltaba `express.json()` (sin él no hay `req.body`), el prefijo
  del router tenía un typo, el orden de middlewares en `/me` estaba invertido, y
  a `/all` y `/orders` no se les había puesto el middleware de auth.
- **Cómo lo solucioné:** agregué `express.json()` antes de los routers, corregí
  el prefijo a `/api/auth`, puse `authMiddleware` antes del handler en `/me`, y
  apliqué `authMiddleware` a `/all` y `/orders`.
- **Cómo lo validé:** register/login responden 201/200, y `/me`, `/orders` y
  `/all` devuelven 401 sin token y 200 con token válido.

## Cómo validé todo el flujo

Levanté el server (`npm run dev`) y probé, en orden: registrar un usuario nuevo
(201 + token), loguearme (200 + token), y usar ese token en las rutas
protegidas. Todos los casos de error (datos faltantes, email repetido,
contraseña incorrecta, token faltante o inválido) devuelven ahora el código HTTP
correcto, y ninguna respuesta expone el hash de la contraseña.

> Nota: los datos son en memoria (`src/data/db.js`), así que al reiniciar el
> server se pierden los usuarios registrados. El usuario `Admin` del seed no se
> puede loguear porque solo está guardado su hash, no la contraseña en texto
> plano; por eso validé el flujo con un usuario registrado en el momento.
