const Sauce = require("../models/Sauce");
const fs = require("fs");

//Envoie toutes les sauces.

exports.getAllSauce = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

//Envoie une sauce en fonction de son id.

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

/*Parse le contenu du req.body, supprime l'id contenu, puis créée une nouvelle sauce en suivant le modèle Sauce.
Y stocke ensuite le contenu de la requête, ainsi que l'url de l'image. Initialise les likes et les dislikes à 0
et créée un tableau vide pour usersLiked et usersDisliked.
Enregistre ensuite la nouvelle dans la BDD.*/

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  console.log(sauceObject);
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
  });
  sauce
    .save()
    .then(() => res.status(201).json({ message: "Sauce enregistrée !" }))
    .catch((error) => res.status(400).json({ error }));
};

/* Cherche la sauce demandée en fonction de l'id de la requête. Vérifie ensuite que l'id de celui qui a créé la sauce
est le même que l'id de celui qui demande à la modifier. Vérifie ensuite si la requête
contient une nouvelle image. Récupère ensuite le contenu modifié puis utilise updateOne
pour mettre la sauce stockée dans la BDD à jour. */

exports.modifySauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id }).then((sauce) => {
    if (sauce.userId !== req.auth.userId) {
      res.status(403).json({ error: "Unauthorized request" });
    } else {
      const sauceObject = req.file
        ? {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get("host")}/images/${
              req.file.filename
            }`,
          }
        : { ...req.body };
      Sauce.updateOne(
        { _id: req.params.id },
        { ...sauceObject, _id: req.params.id }
      )
        .then(() => res.status(200).json({ message: "Sauce modifiée !" }))
        .catch((error) => res.status(400).json({ error }));
    }
  });
};

/* Si la requête contient like === 1, augmente de +1 les likes de la sauce et envoie l'id de l'utilisateur qui a liké
dans le tableau usersLiked.
Si la requête contient like === -1 fait la même chose pour les dislikes.
Si la requête contient like === 0, vérifie si le tableau usersLiked de la sauce contient l'id de l'utilisateur contenu 
dans la requête. Si oui, enlève un like et enlève l'id de l'utilisateur du tableau usersLiked.
Sinon, vérifie si le tableau usersDisliked de la sauce contient l'id de l'utilisateur contenu dans la requête. Si oui,
enlève un dislike et enlève l'id de l'utilisateur du tableau usersDisliked. */

exports.likeSauce = (req, res, next) => {
  if (req.body.like === 1) {
    Sauce.updateOne(
      { _id: req.params.id },
      {
        $inc: { likes: +1 },
        $push: { usersLiked: req.body.userId },
      }
    )

      .then(() => res.status(200).json({ message: "Sauce aimée!" }))
      .catch((error) => res.status(400).json({ error }));
  } else if (req.body.like === -1) {
    Sauce.updateOne(
      { _id: req.params.id },
      {
        $inc: { dislikes: +1 },
        $push: { usersDisliked: req.body.userId },
      }
    )
      .then(() => res.status(200).json({ message: "Sauce non aimée!" }))
      .catch((error) => res.status(400).json({ error }));
  } else if (req.body.like === 0) {
    Sauce.findOne({ _id: req.params.id })
      .then((sauce) => {
        if (sauce.usersLiked.includes(req.body.userId)) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { likes: -1 },
              $pull: { usersLiked: req.body.userId },
            }
          )
            .then(() => {
              res.status(200).json({ message: "Like supprimé!" });
            })
            .catch((error) => res.status(400).json({ error }));
        } else if (sauce.usersDisliked.includes(req.body.userId)) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { dislikes: -1 },
              $pull: { usersDisliked: req.body.userId },
            }
          )
            .then(() => {
              res.status(200).json({ message: "Dislike supprimé!" });
            })
            .catch((error) => res.status(400).json({ error }));
        }
      })
      .catch((error) => res.status(400).json({ error }));
  } else {
    res.status(403).json({ error: "unauthorized request" });
  }
};

/* Vérifie si l'id de l'utilisateur qui demande à supprimer la sauce est le même que celui qui a créé la sauce. 
Récupère ensuite le nom de l'image afin de la supprimer. Puis supprime la sauce de la BDD.
 */

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId !== req.auth.userId) {
        res.status(400).json({
          error: new Error("Unauthorized request!"),
        });
      } else {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: "Sauce supprimée !" }))
            .catch((error) => res.status(400).json({ error }));
        });
      }
    })
    .catch((error) => res.status(500).json({ error }));
};
