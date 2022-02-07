const bcrypt = require("bcrypt");
const User = require("../models/User");
const passwordValidator = require('password-validator');
const jwt = require("jsonwebtoken");

require("dotenv").config();

// Mise en place du password validator

const pwSchema = new passwordValidator();

pwSchema
  .is().min(8)                                    // Minimum length 8
  .is().max(100)                                  // Maximum length 100
  .has().uppercase()                              // Must have uppercase letters
  .has().lowercase()                              // Must have lowercase letters
  .has().digits(2)                                // Must have at least 2 digits
  .has().not().spaces()                           // Should not have spaces
  .is().not().oneOf(['Passw0rd', 'Password123']);

  /*Signup vérifie que le password est suffisamment fort, puis bcrypt hash le password.
  On enregistre ensuite l'email et le hash dans une constante user qui suit notre modèle User.
  Puis on save user dans la BDD.*/

exports.signup = (req, res, next) => {
  if (!pwSchema.validate(req.body.password)) {
    res.status(401).json({ message: "Le mot de passe doit contenir entre 8 et 100 caractères, doit avoir des minuscules et des majuscules, ainsi qu'au moins 2 chiffres et pas d'espace." });
  } else {
    bcrypt
      .hash(req.body.password, 10)
      .then((hash) => {
        const user = new User({
          email: req.body.email,
          password: hash,
        });
        user
          .save()
          .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
          .catch((error) => res.status(400).json({ error }));
      })
      .catch((error) => res.status(500).json({ error }));
  }
};

/*Cherche l'utilisateur en fonctionnant de son adresse email. Bcrypt compare ensuite le password entré avec
celui correspondant à l'adresse email dans la BDD. S'ils correspondent, on renvoie un objet JSON contenant un userId
correspondant à l'user._id de l'utilisateur, ainsi qu'un token d'authentification valable 24h. Le token contient
l'id de l'utilisateur (encodé) en tant que payload. */

exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non trouvé !" });
      }
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res.status(401).json({ error: "Mot de passe incorrect !" });
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, process.env.TOKEN, {
              expiresIn: "24h",
            }),
          });
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
