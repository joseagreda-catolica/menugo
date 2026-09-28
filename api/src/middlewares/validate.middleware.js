// Valida una parte de la request (body, params o query) contra un schema de
// Zod. Si falla, deja que error.middleware.js formatee la respuesta: aqui
// solo se relanza el ZodError.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = validate;
