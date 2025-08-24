const Joi = require('joi');

function validateRegister(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    role: Joi.string().valid('user', 'admin').default('user')
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

function validateLogin(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

function validateData(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().required(),
    value: Joi.string().required(),
    isPublic: Joi.boolean().default(false)
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateData
};