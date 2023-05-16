const { db } = require("../util/admin");

const { validatePostRequestData } = require("../util/validators");

exports.getAllRequests = (req, res) => {
  db.collection("requests")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let requests = [];
      data.forEach((doc) => {
        requests.push({
          description: doc.data().description,
          createdAt: doc.data().createdAt,
          userHandle: doc.data().userHandle,
          userImage: doc.data().userImage,
          requestImage: doc.data().requestImage,
          offerCount: doc.data().offerCount,
          offerAccepted: doc.data().offerAccepted,
          car: doc.data().car,
          make: doc.data().make,
          type: doc.data().type,
          requestId: doc.id,
        });
      });
      return res.json(requests);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.getOffers = (req, res) => {
  db.collection("offers")
    .where("requestId", "==", req.params.requestId)
    .get()
    .then((data) => {
      let offers = [];
      data.forEach((doc) => {
        offers.push({
          offerDescription: doc.data().offerDescription,
          createdAt: doc.data().createdAt,
          userHandle: doc.data().userHandle,
          userImage: doc.data().userImage,
          offerAmount: doc.data().offerAmount,
          offerAccepted: doc.data().offerAccepted,
          offerId: doc.id,
        });
      });
      return res.json(offers);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.postRequest = (req, res) => {
  if (typeof req.body.requestImage === "undefined") {
    req.body.requestImage = "No image sent";
  }

  const newRequest = {
    description: req.body.description,
    car: req.body.car,
    make: req.body.make,
    type: req.body.type,
    requestImage: req.body.requestImage,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    offerAccepted: false,
    isHidden: false,
    offerCount: 0,
  };

  const { valid, errors } = validatePostRequestData(newRequest);

  if (!valid) return res.status(400).json(errors);

  db.collection("requests")
    .add(newRequest)
    .then((doc) => {
      const resRequest = newRequest;
      resRequest.requestId = doc.id;
      res.json(resRequest);
    })
    .catch((err) => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
};
// Fetch one scream
exports.getScream = (req, res) => {
  let screamData = {};
  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream not found" });
      }
      screamData = doc.data();
      screamData.screamId = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("screamId", "==", req.params.screamId)
        .get();
    })
    .then((data) => {
      screamData.comments = [];
      data.forEach((doc) => {
        screamData.comments.push(doc.data());
      });
      return res.json(screamData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
// Comment on a comment
/* exports.commentOnScream = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ comment: "Must not be empty" });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    screamId: req.params.screamId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
  };
  console.log(newComment);

  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream not found" });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Something went wrong" });
    });
}; */
exports.offerOnRequest = (req, res) => {
  if (req.body.offerDescription.trim() === "")
    return res.status(400).json({ offerDescription: "Must not be empty" });
  if (req.body.offerAmount.trim() === "")
    return res
      .status(400)
      .json({ offerAmount: "Error: You have to type an amount" });

  const newOffer = {
    offerDescription: req.body.offerDescription,
    offerAmount: req.body.offerAmount,
    createdAt: new Date().toISOString(),
    requestId: req.params.requestId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    offerAccepted: false,
  };
  console.log(newOffer);

  const offerDocument = db
    .collection("offers")
    .where("userHandle", "==", req.user.handle)
    .where("requestId", "==", req.params.requestId)
    .limit(1);

  const requestDocument = db.doc(`/requests/${req.params.requestId}`);

  let requestData;

  requestDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        requestData = doc.data();
        requestData.requestId = doc.id;
        return offerDocument.get();
      } else {
        return res.status(404).json({ error: "Request not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection("offers")
          .add(newOffer)
          .then(() => {
            requestData.offerCount++;
            return requestDocument.update({
              offerCount: requestData.offerCount,
            });
          })
          .then(() => {
            return res.json(newOffer);
          });
      } else {
        return res
          .status(400)
          .json({ error: "You already made an offer for this request" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
// Like a scream
exports.likeScream = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("screamId", "==", req.params.screamId)
    .limit(1);

  const screamDocument = db.doc(`/screams/${req.params.screamId}`);

  let screamData;

  screamDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Scream not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection("likes")
          .add({
            screamId: req.params.screamId,
            userHandle: req.user.handle,
          })
          .then(() => {
            screamData.likeCount++;
            return screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            return res.json(screamData);
          });
      } else {
        return res.status(400).json({ error: "Scream already liked" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.unlikeScream = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("screamId", "==", req.params.screamId)
    .limit(1);

  const screamDocument = db.doc(`/screams/${req.params.screamId}`);

  let screamData;

  screamDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Scream not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: "Scream not liked" });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            screamData.likeCount--;
            return screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            res.json(screamData);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
// Delete a scream
exports.deleteScream = (req, res) => {
  const document = db.doc(`/screams/${req.params.screamId}`);
  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream not found" });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: "Unauthorized" });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: "Scream deleted successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
exports.acceptOffer = (req, res) => {
  const offerDocument = db.doc(`/offers/${req.params.offerId}`);
  const requestDocument = db.doc(`/requests/${req.params.requestId}`);

  let offerData = {};
  let requestId = "";
  requestDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(403).json({ error: "Request dose not exist" });
      } else if (doc.data().offerAccepted) {
        return res
          .status(403)
          .json({ error: "Request already has another accepted offer" });
      } else {
        requestId = doc.id;
        return offerDocument
          .get()
          .then((offer) => {
            if (!offer.exists) {
              return res.status(403).json({ error: "Offer dose not exist" });
            } else if (requestId === offer.data().requestId) {
              offerData = offer.data();
              offerData.offerAccepted = true;
              offerData.offerId = offer.id;
              return offerDocument.update({ offerAccepted: true });
            } else {
              return res.status(403).json({
                error: "The offer provided dosent belog to this request",
              });
            }
          })
          .then(() => {
            requestDocument.update({ offerAccepted: true });
          })
          .then(() => {
            res.json(offerData);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.getUserOffers = (req, res) => {
  let userOffers = {};
  db.collection("offers")
    .where("userHandle", "==", req.user.handle)
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      userOffers.offers = [];
      data.forEach((doc) => {
        userOffers.offers.push({
          offerId: doc.id,
          offerDescription: doc.data().offerDescription,
          offerAmount: doc.data().offerAmount,
          createdAt: doc.data().createdAt,
          requestId: doc.data().requestId,
          userHandle: doc.data().userHandle,
          userImage: doc.data().userImage,
          offerAccepted: doc.data().offerAccepted,
        });
      });
      return res.json(userOffers);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
