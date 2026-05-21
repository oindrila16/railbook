const pnrService = require('../services/pnr.service');

async function lookup(req, res) {
  const reference = req.params.reference || req.query.reference;
  const result = await pnrService.lookupByReference(reference);
  res.json({ success: true, data: result });
}

module.exports = { lookup };
