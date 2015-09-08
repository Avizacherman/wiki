$(document).ready(function() {

	$('.redirectPath').val(location.pathname)

	$(".dropperbutt").each(function() {
		$(this).on('click', function() {
			console.log($(this))
			var liTargetId = "#" + $(this).attr('id').replace('search', 'h')
			var textor = $(this).attr('id').replace('search', '')
			$('.drop').removeClass('active')
			$(liTargetId).addClass('active')
			$('#selector').text(textor)
			$('#find').attr('name', textor.toLowerCase())
		})
	})

	if ($.cookie('user')) {
		$('#loginButton').remove()
		var $profileButton = $("<li class='active'></li>")
		$profileButton.append("<a href='/profile'>Profile</a>")

		var username = $.cookie('user')
		var $user = $("<li>")
				$userinfo = $('<label>').text("logged in as " + username).addClass("userLog")
		$user.append($userinfo)

		$('#logon').removeClass('active')

		$logout = $('<li class=active>').attr('id', 'logout').addClass('active')

		$logoutLogo = $('<i>').addClass("fa fa-sign-out")
		$logoutButton = $('<a href=#>').text('Logout   ').attr('id', "logoutButton")

		$logoutButton.append($logoutLogo)

		$logout.append($logoutButton)

		$logoutButton.on('click', function() {
			$.removeCookie('user', {
				path: '/'
			})
			location.reload()
		})

		$('#logger').append($user).append($profileButton).append($logout)
	} else {
		var $loginSymbol = $('<i>').addClass("fa fa-sign-in")
		console.log($loginSymbol)
		var $logonButton = $('<a href="#">').text('Login   ').attr('id', "loginButton")
		$logonButton.append($loginSymbol)
		$logonButton.on('click', function() {
			$('#loginModal').foundation('reveal', 'open')
		})
		$('#logon').append($logonButton).addClass('active')

	}

	$('#newUserButton').on('click', function(event) {
		event.preventDefault();
		$('#newUserModal').foundation('reveal', 'open')
	})

	$("#newUserSubmit").on('click', function(event) {
		$newP1 = $('#newPassword')
		$newP2 = $('#newPassword2')
		if ($newP1.val() != $newP2.val()) {
			event.preventDefault()
			$("<p id='passwordMatchErr'> Your passwords do not match </p>").insertBefore('#passwordPlaceholder')
			$('#newUserModal').effect('shake', 20)
			$newP1.val('')
			$newP2.val('')
		}

	})
	$('#closeNew').on('click', function() {
		$newp1.val('')
		$newp2.val('')
		$('#newUser').val('')
		$('#passwordMatchErr').remove()
	})

	$('#submitIndex').on('click', function(event){
		event.preventDefault()
		newRoute = $('#titleIndex').val().trim()
		$('#submitterIndex').attr('action', '/wiki/'+newRoute + '/new').submit()

	})
	$('#markup').on('click',function(){
		$('#markupCheatSheet').foundation('reveal', 'open')
	})
})