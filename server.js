// ----------------------------------------------------------------
//
// Filename: server.js
// Description: This file sets up server connection using ExpressJS
// 	and connecting to SQLite database
// Resource: https://developerhowto.com/2018/12/29/build-a-rest-api-with-node-js-and-express-js/
//
// ----------------------------------------------------------------
const express = require("express")
const app = express()
const db = require("./sqlite.js")
const md5 = require("md5")

// -------------------------------
// Setting up BodyParser to obtain URL parameters
// -------------------------------
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Server port
const HTTP_PORT = 5000 
// Start server
app.listen(HTTP_PORT, () => {
    console.log("Server running on port " + HTTP_PORT)
});

// -------------------------------
// Root endpoint
// -------------------------------
app.get("/", (req, res, next) => {
    res.json({"message":"Ok"})
});

// -------------------------------
// Get List of users
// -------------------------------
app.get("/api/users", (req, res, next) => {
	const sql = "select * from user"
	const params = []
	db.all(sql, params, (err, rows) => {
			if (err) {
				res.status(400).json({"error":err.message});
				return;
			}
			res.json({
					"message":"success",
					"data":rows
			})
		});
});

// -------------------------------
// Get One user by id (:id)
// -------------------------------
app.get("/api/user/:id", (req, res, next) => {
	const sql = "select * from user where id = ?"
	const params = [req.params.id]
	db.get(sql, params, (err, row) => {
			if (err) {
				res.status(400).json({"error":err.message});
				return;
			}
			res.json({
					"message":"success",
					"data":row
			})
		});
});

// --------------------------------
// Create a New User
// --------------------------------
app.post("/api/user/", (req, res, next) => {
	const errors=[]
	if (!req.body.password){
			errors.push("No password specified");
	}
	if (!req.body.email){
			errors.push("No email specified");
	}
	if (errors.length){
			res.status(400).json({"error":errors.join(",")});
			return;
	}
	const data = {
			name: req.body.name,
			email: req.body.email,
			password : md5(req.body.password)
	}
	const sql ='INSERT INTO user (name, email, password) VALUES (?,?,?)'
	const params =[data.name, data.email, data.password]
	db.run(sql, params, function (err, result) {
			if (err){
					res.status(400).json({"error": err.message})
					return;
			}
			res.json({
					"message": "success",
					"data": data,
					"id" : this.lastID
			})
	});
})

// -------------------------------
// Update an User
// -------------------------------
app.patch("/api/user/:id", (req, res, next) => {
	const data = {
			name: req.body.name,
			email: req.body.email,
			password : req.body.password ? md5(req.body.password) : null
	}
	db.run(
			`UPDATE user set 
				name = COALESCE(?,name), 
				email = COALESCE(?,email), 
				password = COALESCE(?,password) 
				WHERE id = ?`,
			[data.name, data.email, data.password, req.params.id],
			function (err, result) {
					if (err){
							res.status(400).json({"error": res.message})
							return;
					}
					res.json({
							message: "success",
							data: data,
							changes: this.changes
					})
	});
})

// --------------------------------
// Delete an User
// --------------------------------
app.delete("/api/user/:id", (req, res, next) => {
	db.run(
			'DELETE FROM user WHERE id = ?',
			req.params.id,
			function (err, result) {
					if (err){
							res.status(400).json({"error": res.message})
							return;
					}
					res.json({"message":"deleted", changes: this.changes})
	});
})


// Default response for any other request
app.use(function(req, res){
    res.status(404);
});