const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  level: { type: String, required: true },
  severity: { type: String, required: true },
  malware_type: { type: String, required: true },
  productivity: { type: String, required: true },
  time: { type: Date, required: true },
  log: { type: String, required: true },
  ip: { type: String, required: true },
  user_agent: { type: String, required: true },
  category: { type: String, required: true },
  category_type: { type: String, required: true },
  url: { type: String, default: null },
});

module.exports = mongoose.model('Log', logSchema, 'server_logs');