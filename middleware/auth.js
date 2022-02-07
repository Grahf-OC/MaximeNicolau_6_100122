const jwt = require("jsonwebtoken");

require("dotenv").config();

/*Configuration du middleware d'authentification.
Le req.headers.authorization comprendre le mot Bearer suivi du token. On split donc l'espace entre les 2 ce qui créée un tableau
avec Bearer et le token. On récupère seulement le token qu'on stocke dans token. On le décode ensuite puis on récupère
l'userId.
On vérifie ensuite que la requête contient un userId et s'il existe qu'il est bien le même que l'userId récupéré dans le token
décodé. */

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.TOKEN);
    const userId = decodedToken.userId;
    req.auth = { userId: userId }; 
    if (req.body.userId && req.body.userId !== userId) {
      throw "Invalid user ID";
    } else {
      next();
    }
  } catch {
    res.status(401).json({
      error: new Error("Invalid request!"),
    });
  }
};
