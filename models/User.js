const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

/*UniqueValidator permet de s'assurer qu'une même adresse mail ne peut exister qu'une seule fois. Un autre utilisateur
ne pourra donc pas s'enregistrer avec la même adresse.*/

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);