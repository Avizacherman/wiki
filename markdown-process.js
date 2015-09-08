exports.MarkdownSet = function(content, options) {

	//heading levels
	var l1 = new RegExp(/^##[\w+\s ]+(\r\n){0,1}/mg)
	var l2 = new RegExp(/^###[\w+\s ]+(\r\n){0,1}/mg)
	var l3 = new RegExp(/^####[\w+\s ]+(\r\n){0,1}/mg)
	var allHeaders = new RegExp(/^##(#{0,2})[\w+ ]+(\r\n)*/mg)
	var htmL1 = new RegExp(/level-1/g)
	var htmL2 = new RegExp(/level-2/g)
	var htmL3 = new RegExp(/level-3/g)

	//font emphasis
	var bold = new RegExp(/\*\*[\w+\!\.\?\s]+\*\*/g)
	var italic = new RegExp(/\^\^[\w+\!\.\?\s]+\^\^/g)

	//linking
	var internalLink = new RegExp(/\([\w+\!\.\?\s]+\|\|[\w+\!\.\?\s]+\)/g)
	var externalLink = new RegExp(/\([\w+\!\.\?\s]+\|\|(http|https)\:\/\/[\.\w+\/]+\)/g)

	//image
	var imageTag = new RegExp(/<<(http|https)\:\/\/[\.\w+\/\_\-]+(\.jpg|\.png|\.gif|\.jpeg)>>/gi)

	//newlines
	var newLine = new RegExp(/\r\n/g)


	//sets options if non-existant
	if (options) {
		this.options = options
	} else {
		this.options = new Object
	}


	//set default options
	if (typeof this.options.buildNav === 'undefined') {
		if (l1.test(content) || l2.test(content) || l3.test(content)) {
			this.options.buildNav = true;
		} else {
			this.options.buildNav = false;
		}
	}

	//content holders
	this.content = content
	this.originalContent = content


	//replace internal links
	this.replaceInternal = function() {

		var fullString = content.replace(internalLink, function(string) {
			var beginSubString = string.replace(/\|[\w+\s]+\)/, function(SubString) {

				return "<a href='/wiki/" + SubString.replace(/\|/, '').replace(/\)/, '') + "'>"
			})
			beginSubString = beginSubString.replace(/\([\w+\s]+\|/g, '')
			var endSubString = string.replace(/\([\w+\s]+\|/, function(SubString) {
				return SubString.replace(/\(/, '').replace(/\|/, '</a>')

			})
			endSubString = endSubString.replace(/\|[\w+\s]+\)/, '')
			return beginSubString + endSubString
		})

		return fullString
	}

	this.replaceExternal = function() {
		var fullString = content.replace(externalLink, function(string) {
			var beginSubString = string.replace(/\|(http|https)\:\/\/[\.\w+\/]+\)/, function(subString) {

				return "<a href='" + subString.replace(/\|/, '').replace(/\)/, '') + "'>"
			})
			beginSubString = beginSubString.replace(/\([\w+\s]+\|/, '')

			var endSubString = string.replace(/\([\w+\s]+\|/, function(subString) {
				return subString.replace(/\(/, '').replace(/\|/, '</a>')
			})
			endSubString = endSubString.replace(/\|(http|https):\/\/[\.\w+\/]+\)/, '')
			return beginSubString + endSubString
		})
		return fullString
	}

	this.buildNav = function() {
		fullHeaders = content.match(allHeaders)
		fullHeaders.unshift('<ol class="wiki-nav">')
		fullHeaders.push('</ol>\r\n')
			//check for html header
		fullHeaders.forEach(function(header, index) {
			if (l1.test(header)) {
				header = header.replace(l1, function(string) {
					string.replace(/##/g, '').replace(/\r\n/g, '')
					return '<li> <a class="level-1" href="#' + string.replace(/ /g, '_') + '">' + string + "</a></li>"
				})
				fullHeaders[index] = header.replace(/##/g, '').replace(/\r\n/g, '')
			} else if (l2.test(header)) {
				header = header.replace(l2, function(string) {
					string.replace(/###/g, '').replace(/\r\n/g, '')
					return '<li> <a class="level-2" href="#' + string.replace(/ /g, '_') + '">' + string + "</a></li>"
				})
				fullHeaders[index] = header.replace(/###/g, '').replace(/\r\n/g, '')
			} else if (l3.test(header)) {
				header = header.replace(l3, function(string) {
					string.replace(/####/g, '').replace(/\r\n/g, '')
					return '<li> <a class="level-3" href="#' + string.replace(/ /g, '_') + '">' + string + "</a></li>"
				})
				fullHeaders[index] = header.replace(/####/g, '').replace(/\r\n/g, '')
			}
		})

		for (i = 0; i < fullHeaders.length; i++) {
			if (htmL1.test(fullHeaders[i])) {
				if (htmL2.test(fullHeaders[i + 1])) {
					fullHeaders[i] = fullHeaders[i] + "<ol>"
					var match = false;
					for (k = i; k < fullHeaders.length; k++) {
						if (match === false && htmL1.test(fullHeaders[k])) {
							match = true
							fullHeaders[k] = "</ol>" + fullHeaders[k]
						}
					}
				}
			}
		if (htmL2.test(fullHeaders[i])) {
				if (htmL3.test(fullHeaders[i + 1])) {
					fullHeaders[i] = fullHeaders[i] + "<ol>"
					var match = false;
					for (k = i; k < fullHeaders.length; k++) {
						if (match === false && htmL1.test(fullHeaders[k])) {
							match = true;
							fullHeaders[k] = "</ol>" + fullHeaders[k]
						}
						if (match === false && htmL2.test(fullHeaders[k])) {
							match = true
							fullHeaders[k] = "</ol>" + fullHeaders[k]
						}
					}

				}
			}
		}

		if (k = fullHeaders.length && match === false) {
			fullHeaders.push("</ol>\r\n")
		}

		navTable = fullHeaders.join('\n')
		return navTable
	}

	this.headers = function() {
			content = content.replace(/####[\w+ ]+(\r\n){0,1}/g, function(string) {
			string = string.replace(/####/, '').replace(/\r\n/, '')
			string = "<h5 class='heading-3' id='" + string.replace(/ /g, '_') + "'>" + string + "</h5>"
			return string
		})

			content = content.replace(/###[\w+ ]+(\r\n){0,1}/g, function(string) {
			string = string.replace(/###/, '').replace(/\r\n/, '')
			string = "<h4 class='heading-2' id='" + string.replace(/ /g, '_') + "'>" + string + "</h4>"
			console.log(string)

			return string
		})
	
		content = content.replace(/##[\w+ ]+(\r\n){0,1}/g, function(string) {

			string = string.replace(/##/, '').replace(/\r\n/, '')
			string = "<h3 class='heading-1' id='" + string.replace(/ /g, '_') + "'>" + string + "</h3>"

			return string
		})

		return content
	}

	this.newlines = function() {
		var string = content.replace(newLine, ' <br/> ')
		return string
	}

	this.replaceBold = function() {
		var replacement = content.replace(bold, function(string){
			string = string.replace('\*\*', '<b class="bold">').replace(/\*\*/, '</b>')
			console.log(string)

			return string
		})
		return replacement
	}

	this.replaceItalic = function() {
			var replacement = content.replace(italic, function(string){

			string = string.replace(/\^\^/, '<em class="italic">').replace(/\^\^/, '</em>')
			return string
		})
		return replacement
	}

	this.replaceImage = function() {
		var replacement = content.replace(imageTag, function(string){
			string = string.replace(/<</g, '').replace(/>>/g, '')
			console.log(string)
			return "<img src='" + string + "'>"
		})
		return replacement
	}

	this.render = function() {


		content = this.replaceExternal()
		content = this.replaceInternal()
		if (this.options.buildNav) {
			stuff = this.buildNav()
			content = stuff + content
		}
		content = this.replaceImage()
		content = this.headers()
		content = this.replaceBold()
		content = this.replaceItalic()
		content = this.newlines()

		return content
	}
}