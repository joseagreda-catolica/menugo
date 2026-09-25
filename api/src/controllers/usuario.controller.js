function yo(req, res) {
  res.json({ usuario: req.usuario });
}

module.exports = { yo };
