// BASIC INIT ////////////////////////////

// Get the needed packages
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var User = require('./models/user');
var Task = require('./models/task');

// Create Express application
var app = express();
var router = express.Router();

// Connect to the mongoose database
mongoose.connect('mongodb://admin:admin@ds031751.mongolab.com:31751/mp3');

// Use environment defined port or 4000
var port = process.env.PORT || 4000;

//Allow CORS so that backend and frontend could pe put on different servers
var allowCrossDomain = function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
	res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
	next();
};
app.use(allowCrossDomain);

// Use the body-parser package in the application
app.use(bodyParser.urlencoded({
	extended: true
}));


// API ROUTES ////////////////////////
app.use('/api', router);


// HOME ROUTE ////////////////////
var homeRoute = router.route('/');

homeRoute.get(function(req, res) {
	res.json({ message: 'Welcome! The endpoints available are /users and /tasks' });
});


// USERS ROUTE ////////////////////////
var userRoute = router.route('/users');

userRoute.get(function(req, res) {

	var where = req.query.where === undefined ? {} : JSON.parse(req.query.where);
	var sort = req.query.sort === undefined ? {} : JSON.parse(req.query.sort);
	var select = req.query.select === undefined ? {} : JSON.parse(req.query.select);
	var skip = req.query.skip === undefined ? 0 : req.query.skip;
	var limit = req.query.limit === undefined ? 0 : req.query.limit;
	var count = req.query.count === undefined ? false : (req.query.count === 'true');

	User.find(where).sort(sort).select(select).skip(skip).limit(limit).exec( 
		function(err, users) {
		
        if (err) {
        	res.statusCode = 500;
        	res.json({ message: 'Error. Please check your query or try again later', data: [] });
        }
        else if (count)
        	res.json({ message: 'ok', data: users.length });
        else
        	res.json({ message: 'ok', data: users });
    });
});

userRoute.post(function(req, res) {
	var user = new User();
	user.name = req.body.name;
	user.email = req.body.email;
	user.pendingTasks = [];
	user.dateCreated = new Date();

	if (!user.name) {
		res.statusCode = 500;
		res.json({ message: 'Name is a required field', data: [] });
	}
	else if (!user.email) {
		res.statusCode = 500;
		res.json({ message: 'Email is a required field', data: [] });
	}
	else {
		user.save(function (err) {
			if (err) {
				res.statusCode = 500;
				res.json({ message: 'Email already in use', data: [] });
			}
			else {
				res.statusCode = 201;
				res.json({ message: 'User added', data: user });
			}
		});
	}
});

userRoute.options(function(req, res) {
	res.writeHead(200);
	res.end();
});


// USERS:ID ROUTE //////////////////////////
var userIdRoute = router.route('/users/:id');

userIdRoute.get(function(req, res) {
	User.findById(req.params.id, function(err, user) {
        if (err || !user) {
            res.statusCode = 404;
            res.json({ message: 'User not found', data: [] });
        }
        else
        	res.json({ message: 'ok', data: user });
    });
});

userIdRoute.put(function(req, res) {
	User.findById(req.params.id, function(err, user) {
        if (err) {
        	res.statusCode = 404;
            res.json({ message: 'User not found', data: [] });
        }
        else {
        	user.name = req.body.name;
    		user.email = req.body.email;
    		if (!user.name) {
    			res.statusCode = 500;
    			res.json({ message: 'Name is a required field', data: [] });
    		}
    		else if (!user.email) {
    			res.statusCode = 500;
    			res.json({ message: 'Email is a required field', data: [] });
    		}
    		else {
				user.save(function (err) {
					if (err) {
						res.statusCode = 500;
						res.json({ message: 'Email already in use', data: [] });
					}
					else
						res.json({ message: 'User updated', data: [] });
				});
    		}	
        }
    });
});

userIdRoute.delete(function(req, res) {
	User.remove({
		_id: req.params.id
	}, function(err, user) {
        if (err) {
            res.writeHead(404);
			res.end();
        }
        else if (user === 1) {
        	res.json({ message: 'User deleted', data: [] });
        	Task.find({assignedUser: req.params.id}, function(err, tasks){
        		for (t = 0; t < tasks.length; t++) {
        			tasks[t].assignedUser = '';
        			tasks[t].assignedUserName = 'unassigned';
        			tasks[t].save(function(err, tk){});
        		}
        	});
        }
        else {
        	res.statusCode = 404;
        	res.json({ message: 'User not found', data: [] });	
        }
    });
});


// TASK ROUTE ////////////////////////
var taskRoute = router.route('/tasks');

taskRoute.get(function(req, res) {

	var where = req.query.where === undefined ? {} : JSON.parse(req.query.where);
	var sort = req.query.sort === undefined ? {} : JSON.parse(req.query.sort);
	var select = req.query.select === undefined ? {} : JSON.parse(req.query.select);
	var skip = req.query.skip === undefined ? 0 : req.query.skip;
	var limit = req.query.limit === undefined ? 0 : req.query.limit;
	var count = req.query.count === undefined ? false : (req.query.count === 'true');

	Task.find(where).sort(sort).select(select).skip(skip).limit(limit).exec( 
		function(err, tasks) {
		
        if (err) {
        	res.statusCode = 500;
        	res.json({ message: 'Error. Please check your query or try again later', data: [] });
        }
        else if (count)
        	res.json({ message: 'ok', count: tasks.length, data: [] });
        else
        	res.json({ message: 'ok', data: tasks });
    });
});

taskRoute.post(function(req, res) {
	var task = new Task();
	task.name = req.body.name;
	task.description = req.body.description ? req.body.description : "Description not provided";
	task.deadline = req.body.deadline;
	task.completed = req.body.completed ? (req.body.completed === 'true') : false;
	task.assignedUser = req.body.assignedUser;
	task.assignedUserName = req.body.assignedUserName ? req.body.assignedUserName : "Not assigned";
	task.dateCreated = new Date();

	if (!task.name) {
		res.statusCode = 500;
		res.json({ message: 'Name is a required field', data: [] });
	}
	else if (!task.deadline) {
		res.statusCode = 500;
		res.json({ message: 'Deadline is a required field', data: [] });
	}
	else {
		task.save(function (err, savedTask) {
			if (err) {
	        	res.statusCode = 500;
	        	res.json({ message: 'Error. Please check your query or try again later', data: [] });
	        }
			else {
				res.statusCode = 201;
				res.json({ message: 'Task added', data: task });

				if (!task.completed) {
					User.findByIdAndUpdate(task.assignedUser, {$push: {"pendingTasks": savedTask.id}},
					function(err, user) {
			        	if (err) {
			        		console.log(err);
			        	}
				    });
				}
			}
		});
	}
});

taskRoute.options(function(req, res) {
	res.writeHead(200);
	res.end();
});


// TASK:ID ROUTE //////////////////////////
var taskIdRoute = router.route('/tasks/:id');

taskIdRoute.get(function(req, res) {
	Task.findById(req.params.id, function(err, task) {
        if (err) {
            res.statusCode = 404;
			res.json({ message: 'Task not found', data: [] });
        }
        else
        	res.json({ message: 'ok', data: task });
    });
});

taskIdRoute.put(function(req, res) {
	Task.findById(req.params.id, function(err, task) {
        if (err) {
            res.statusCode = 404;
			res.json({ message: 'Task not found', data: [] });
        }
        else {
        	task.name = req.body.name;
			task.description = req.body.description;
			task.deadline = req.body.deadline;
			task.completed = req.body.completed;
			task.assignedUser = req.body.assignedUser;
			task.assignedUserName = req.body.assignedUserName;
        	
        	if (!task.name) {
        		res.statusCode = 500;
        		res.json({ message: 'Name is a required field', data: [] });
        	}
        	else if (!task.deadline) {
        		res.statusCode = 500;
        		res.json({ message: 'Deadline is a required field', data: [] });
        	}
        	else {
	        	task.save(function (err) {
	        		if (err) {
	        			res.statusCode = 500;
						res.json({ message: 'Error updating task. Please try again later', data: [] });
					}
	        		else {
	        			res.json({ message: 'Task updated', data: task });

        				if (!task.completed) {
        					User.findByIdAndUpdate(task.assignedUser, {$push: {"pendingTasks": task.id}},
        					function(err, user) {
        			        	if (err) {
        			        		console.log(err);
        			        	}
        				    });
        				}
        				else {
							User.findByIdAndUpdate(task.assignedUser, {$pull: {"pendingTasks": task.id}},
							function(err, user) {
					        	if (err) {
					        		console.log(err);
					        	}
						    });
        				}
	        		}
	        	});
        	}
        }
    });
});

taskIdRoute.delete(function(req, res) {
	Task.remove({
		_id: req.params.id
	}, function(err, task) {
        if (err) {
            res.statusCode = 500;
			res.json({ message: 'Error deleting task. Please try again later', data: [] });
        }
        else if (task === 1) {
        	res.json({ message: 'Task deleted', data: [] });
        }
        else {
        	res.statusCode = 404;
        	res.json({ message: 'Task not found', data: [] });	
        }
    });
});


// Start the server
app.listen(port);
console.log('Server running on port ' + port); 