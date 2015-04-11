var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  name: {
  	type: String,
  	required: true
  },
  email: { 
  	type: String,
  	required: '{PATH} is required!',
  	unique: true
  },
  pendingTasks: [String],
  dateCreated: Date
});

module.exports = mongoose.model('User', UserSchema);