const express = require('express');
const path = require('path');
const swaggerUiDist = require('swagger-ui-dist');

const router = express.Router();

// RNF-09: documentacion interactiva del API a partir de api/openapi.yaml. Swagger UI se sirve
// desde el propio servidor (swagger-ui-dist), asi que funciona sin conexion a internet.
const PAGINA = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MenúGo API · Documentación</title>
    <link rel="stylesheet" href="/api/docs/assets/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api/docs/assets/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/api/docs/openapi.yaml',
        dom_id: '#swagger-ui',
        persistAuthorization: true,
      });
    </script>
  </body>
</html>`;

router.get('/', (req, res) => res.type('html').send(PAGINA));
router.get('/openapi.yaml', (req, res) => res.type('text/yaml').sendFile(path.join(__dirname, '../../openapi.yaml')));
router.use('/assets', express.static(swaggerUiDist.getAbsoluteFSPath()));

module.exports = router;
