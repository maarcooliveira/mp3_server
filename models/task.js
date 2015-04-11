var mongoose = require('mongoose');

var TaskSchema = new mongoose.Schema({
  name: {
  	type: String,
  	required: true
  },
  description: String,
  deadline: {
  	type: Date,
  	required: true
  },
  completed: Boolean,
  assignedUser: {
  	type: String,
  	default: ''
  },
  assignedUserName: {
  	type: String,
  	default: 'unassigned'
  },
  dateCreated: Date
});

module.exports = mongoose.model('Task', TaskSchema);