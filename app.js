var express = require('express');
var ejs = require('ejs');
var fs = require('fs');
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3')
var methodOverride = require('method-override');
var request = require('request')
var cookieParser = require('cookie-parser')
var markdownProcessor = require('./markdown-process')

var nodemailer = require('nodemailer')
var directTransport = require('nodemailer-direct-transport')

var urlencodedBodyParser = bodyParser.urlencoded({
	extended: false
});
var _ = require('underscore')

var app = express();

function convertTimestamp(timestamp) {
	var t = timestamp.split(/[- :]/);
	var convertedTimestamp = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);
	return convertedTimestamp
}

var transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: "ramenwikinyc@gmail.com",
		pass: "ramenramen"
	}
})

app.use(urlencodedBodyParser)
app.use(express.static('resources'))
app.use(methodOverride('_method'))
app.set('view_engine', 'ejs')
app.use(cookieParser());

var db = new sqlite3.Database('wiki.db')

function grabTitle(path) { //get the title of a :content page
	return path.replace('/wiki/', '').replace(/%20/g, ' ').replace('/edit', '').replace('/new', '').replace(/_/g, ' ').replace('/comment', '').replace(/\b\w/g, function(letter) {
		return letter.toUpperCase();

	})

}

function arrayify(string) { //convert an array into a string (useful for tags)
	string = string.replace(/\[/g, '').replace(/\]/g, '')
	array = string.split(', ')
	return array
}

function tagify(string) { //convert a string into a string with brackets which can then be searched in sql
	return "[" + string + "]"
}

function renderPage(template, dataSet, modalsOn) { //custom render function
	var header = ejs.render(fs.readFileSync('views/header.ejs', 'utf8'), dataSet)
	var content = ejs.render(fs.readFileSync('views/' + template + '.ejs', 'utf8'), dataSet)
	var modals = ejs.render(fs.readFileSync('views/modals.ejs', 'utf8'), dataSet)
	var footer = ejs.render(fs.readFileSync('views/footer.ejs', 'utf8'), dataSet)

	var html = header + content + modals + footer
	return html
}


app.get('/', function(req, res) {
	res.redirect('/wiki')
	return false;

})

app.get('/wiki', function(req, res) {

	db.get('SELECT * FROM pages, users WHERE users.id=user_id AND most_recent=1 ORDER BY timestamp DESC;', function(err, row) {
		if (!row) {
			res.send(renderPage('index', {
				newBuild: true
			}))
		} else {
			var data = row
			data.tags = arrayify(data.tags)
			tempContent = new markdownProcessor.MarkdownSet(data.content, {
				buildNav: false
			})
			tempContent = tempContent.render()
			data.content = tempContent
			data.timestamp = convertTimestamp(data.timestamp)
			res.send(renderPage('index', {
				data: data,
				newBuild: false
			}))
		}
	})
})

app.get('/profile', function(req, res) {
	if (!req.cookies.user) {
		res.redirect('/badlogin')
	} else {
		username = req.cookies.user

		db.get('SELECT * FROM users WHERE user_name=?', username, function(err, row) {
			if (err) console.log(err)
			else {
				res.send(renderPage('profile', {
					data: row
				}))
			}
		})
	}
})

app.post('/newUser', function(req, res) {
	path = req.body.redirectPath

	db.get('SELECT * FROM users WHERE user_name=?', req.body.user, function(err, row) {
		console.log(row)
		if (!row) {
			db.run('INSERT INTO users (user_name, password, email) VALUES (?,?,?)', req.body.user, req.body.password, req.body.email, function(err) {
				res.send(renderPage('logsuc', {
					user: req.body.user,
					path: path
				}))
			})
		} else {
			res.send(renderPage('userTaken', {
				nothing: null
			}))

		}
	})

})

app.get('/badlogin', function(req, res) {
	res.send(renderPage('logfail', {
		nothing: null
	}))


})

app.post('/login', function(req, res) {
	path = req.body.redirectPath
	console.log(req.body)
	db.get('SELECT * FROM users WHERE user_name=?', req.body.user, function(err, row) {
		if (!row) {
			res.redirect('/badlogin')
		} else if (row.password != req.body.password) {
			res.redirect('/badlogin')
		} else if (row.password === req.body.password) {
			res.send(renderPage('logsuc', {
				user: req.body.user,
				path: path
			}))
		} else {
			res.redirect('/badlogin')

		}

	})
})

app.get('/wiki/:content', function(req, res) {
	var spaces = new RegExp('\%20')
	console.log(req.path)

	if (spaces.test(req.path)) {
		var parsedPath = req.path.replace(/\%20/g, '_')
		res.redirect(parsedPath)
		return false
	}

	var title = grabTitle(req.path.trim())
	db.get('SELECT content, timestamp, user_name, tags, title FROM users, pages WHERE users.id=user_id AND title=? AND most_recent=1', title, function(err, row) {
		if (!row) {
			console.log(title)
			console.log(row)
			res.redirect(req.path + '/new')
			return false
		} else {
			var data = row
			tempContent = new markdownProcessor.MarkdownSet(data.content)
			tempContent = tempContent.render()
			data.content = tempContent
			data.tags = arrayify(data.tags)
			data.timestamp = convertTimestamp(data.timestamp)

			db.all('SELECT comment, timestamp, user_name FROM users, comments WHERE users.id=user_id AND page_title=? ORDER BY timestamp DESC', title, function(err, table) {
				if (err) {
					console.log(err)
				} else {
					if (!table[0]) {
						console.log('no comments')
						res.send(renderPage('show', {
							data: data,
							returnPath: req.path
						}))
					} else {
						var comments = table
						for (i in comments) {
							comments[i].timestamp = convertTimestamp(comments[i].timestamp)
						}
						console.log(comments)
						res.send(renderPage('show', {
							data: data,
							returnPath: req.path,
							comments: comments
						}))
					}
				}
			})
		}
	})

})

app.get('/wiki/:content/print', function(req, res) {
	var spaces = new RegExp('\%20')


	if (spaces.test(req.path)) {
		var parsedPath = req.path.replace(/\%20/g, '_')
		res.redirect(parsedPath)
		return false
	}

	var title = grabTitle(req.path.replace('/print', ''))
	db.get('SELECT content, timestamp, user_name, tags, title FROM users, pages WHERE users.id=user_id AND title=? AND most_recent=1', title, function(err, row) {
		if (!row) {
			res.redirect(req.path + '/new')
			return false
		} else {
			var data = row
			tempContent = new markdownProcessor.MarkdownSet(data.content, {
				buildNav: false
			})
			tempContent = tempContent.render()
			data.content = tempContent
			data.tags = arrayify(data.tags)
			data.timestamp = convertTimestamp(data.timestamp)
			res.render('print.ejs', {
				data: data
			})
		}
	})
})

app.get('/wiki/:content/revisions', function(req, res) {
	var spaces = new RegExp('\%20')

	console.log(req.params.content)

	if (spaces.test(req.path)) {
		var parsedPath = req.path.replace(/\%20/g, '_')
		res.redirect(parsedPath)
		return false
	}

	var title = grabTitle(req.path.replace('/revisions', ''))
	db.all('SELECT content, timestamp, user_name, tags, title FROM users, pages WHERE users.id=user_id AND title=? ORDER BY timestamp DESC', title, function(err, table) {
		if (!table) {
			res.redirect(req.path + '/new')
			return false
		} else {
			var dataset = table
			dataset.forEach(function(data, index) {
				dataset[index].tags = arrayify(data.tags)
				dataset[index].timestamp = convertTimestamp(data.timestamp)
				marker = new markdownProcessor.MarkdownSet(dataset[index].content)
				dataset[index].content = marker.render()
			})
			console.log(dataset)
			res.send(renderPage('revisions', {
				dataset: dataset
			}))
		}
	})
})

app.get('/search', function(req, res) {
	var target = Object.keys(req.query)[0]
	var originalString = req.query[target]
	switch (target) {
		case 'title':
			searchTitle = req.query[target].replace(/\b\w/g, function(letter) {
				return letter.toUpperCase();

			})
			var searchArray = []
			var returnArray = []
			searchArray.push(searchTitle)
			searchArray.push(searchTitle.replace(/\w\b/, function(endOfWord) {
				return endOfWord + '%'
			}))
			for (i = 0; i <= searchTitle.length - 1; i++) {
				searchTitle = searchTitle.replace(/%/, '').replace(/\w/, '%')
				searchArray.push(searchTitle)
			}
			searchArray.forEach(function(search, index) {
				db.all("SELECT title, user_name, timestamp FROM pages, users WHERE users.id=user_id AND most_recent=1 AND title LIKE ?", search, function(err, rows) {

					returnArray.push(rows)

					if (index === searchArray.length - 3) {
						returnArray = _.flatten(returnArray)
						returnArray = _.uniq(returnArray, 'title')
						res.send(renderPage('results', {
							data: returnArray,
							searchString: originalString
						}))
					}
				})
			})

			break;
		case 'tag':
			var searchTag = '%' + req.query[target].toLowerCase() + '%'
			db.all('SELECT title, user_name, timestamp, tags FROM pages, users WHERE users.id=user_id AND most_recent=1 AND tags LIKE ?', searchTag, function(err, rows) {
				if (err) console.log(err)
				else {
					res.send(renderPage('results', {
						data: rows,
						searchString: originalString
					}))
				}
			})
			break;
		case 'user':
			var searchUser = req.query[target]
			db.all('SELECT title, user_name, timestamp FROM pages, users WHERE users.id=user_id AND most_recent=1 AND users.user_name LIKE ?', searchUser, function(err, rows) {
				if (err) {
					console.log(err)
				} else {
					res.send(renderPage('results', {
						data: rows,
						searchString: originalString
					}))

				}
			})
	}

})

app.get('/wiki/:content/new', function(req, res) {
	var spaces = new RegExp('\%20')



	if (spaces.test(req.path)) {
		var parsedPath = req.path.replace(/\%20/g, '_')
		res.redirect(parsedPath)
		return false;
	}
	var returnPath = req.path.replace('/new', '');
	title = grabTitle(req.path)
	db.get('SELECT * FROM pages WHERE title=?', title, function(err, row) {
		if (row) {
			res.redirect(returnPath)
			return false;
		} else {
			res.send(renderPage('new', {
				title: title,
				returnPath: returnPath
			}))

		}
	})
})

app.get('/wiki/:content/edit', function(req, res) {
	var spaces = new RegExp('\%20')


	if (spaces.test(req.path)) {
		var parsedPath = req.path.replace(/\%20/g, '_')
		res.redirect(parsedPath)
		return false;
	}
	var returnPath = req.path.replace('/edit', '');
	title = grabTitle(req.path.replace('/edit', ''))
	db.get('SELECT content, tags, title FROM pages WHERE title=? AND most_recent=1', title, function(err, row) {
		if (!row) {
			res.redirect(req.path.replace('/edit', '/new'))
			return false;
		} else {
			data = row;
			data.tags = data.tags.replace(/\[/g, '').replace(/\]/g, '')
			data.content = data.content.replace(/\r/g, '').replace(/\n/g, '\\n')
			res.send(renderPage('edit', {
				data: data,
				returnPath: returnPath
			}))
		}
	})

})


app.post('/wiki/:content/edit', function(req, res) {
	var title = grabTitle(req.path.trim())
	if (req.cookies.user) {
		username = req.cookies.user
	} else {
		username = "Anonymous"
	}
	db.get('SELECT email FROM users, pages WHERE users.id = user_id AND most_recent=1 AND title=?', title, function(err, row) {
		console.log(row)
		email = row.email

		db.get('SELECT id FROM users WHERE user_name=?', username, function(err, row) {
			var userid = row.id
			var tags = tagify(req.body.tags)
			var content = req.body.content
			var newTitle = req.body.title.trim()
			if (newTitle!=title){
				var rename = "and has been renamed " + newTitle
			} else {
				var rename = ""
			}
			db.run('UPDATE pages SET title=? WHERE title=?', newTitle, title, function(err){
				if(err) console.log(err)
			db.run('INSERT INTO pages (user_id, title, content, tags) VALUES (?,?,?,?)', userid, newTitle, content,
				tags,
				function(err) {
					transporter.sendMail({
						to: email,
						subject: 'Page Updated',
						html: "<a href='104.131.4.248:1337/wiki/" + title + "'>" + title + "</a>" + " has been updated by " + username + rename
					}, function(err, response) {
						if (err) console.log(err)
						else console.log("Message sent: " + response.message)
					})

					res.redirect('/wiki/'+newTitle)
					return false
				})
			})
		})
	})
})

app.post('/wiki/:content/new', function(req, res) {
	var title = grabTitle(req.path).trim()

	db.get('SELECT * FROM pages WHERE title=?', title, function(err, row) {
		if (row) {
			res.send(renderPage('alreadyexists', {
				path: req.path.replace('/new', '')
			}))
		} else {

			if (req.cookies.user) {
				username = req.cookies.user
			} else {
				username = "Anonymous"
			}
			db.get('SELECT id FROM users WHERE user_name=?', username, function(err, row) {
				var userid = row.id
				var tags = tagify(req.body.tags)
				var content = req.body.content
				db.run('INSERT INTO pages (user_id, title, content, tags) VALUES (?,?,?,?)', userid, title, content, tags, function(err) {
					res.redirect(req.path.replace('/new', ''))
					return false
				})
			})
		}
	})
})

app.get('/all', function(req, res) {
	db.all('SELECT title, timestamp FROM pages WHERE most_recent=1 ORDER BY timestamp DESC', function(err, table) {
		if (!table[0]) {
			res.redirect('/wiki')
		} else {
			res.send(renderPage('all', {
				dataset: table
			}))
		}

	})
})

app.post('/wiki/:content/comment', function(req, res) {
	var title = grabTitle(req.path).trim()
	if (req.cookies.user) {
		var username = req.cookies.user
	} else {
		username = "Anonymous"

	}
	var comment = req.body.comment
	db.get('SELECT id FROM users WHERE user_name=?', username, function(err, row) {
		if (err) console.log(err);
		else {
			var userid = row.id
		}
		db.run('INSERT INTO comments(comment, user_id, page_title) VALUES (?, ?, ?)', comment, userid, title, function(err) {
			if (err) {
				console.log(err)
			} else res.redirect('/wiki/' + title)
		})
	})
})
app.listen(1337)