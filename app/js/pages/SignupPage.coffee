Page = require "../Page"
context = require '../context'
MainPage = require './MainPage'
utils = require './utils'

module.exports = class SignupPage extends Page
  events:
    'submit #form_signup' : 'signupClicked'
    'click #cancel_button' : 'cancelClicked'

  activate: ->
    @setTitle ""
    @$el.html require('./SignupPage.hbs')()

  cancelClicked: ->
    @pager.closePage()

  signupClicked: (e) ->
    # Prevent actual submit
    e.preventDefault()

    email = @$("#signup_email").val()
    username = @$("#signup_username").val()
    password = @$("#signup_password").val()

    if not username or username.length == 0
      alert(T("Username required"))
      return

    if not password or password.length < 5
      alert(T("Password of at least 5 characters required"))
      return

    if not email or email.length == 0
      alert(T("Email required"))
      return

    url = @apiUrl + 'users/' + username
    req = $.ajax(url, {
      data : JSON.stringify({
        email: email
        password: password
      }),
      contentType : 'application/json',
      type : 'PUT'})

    # Disable button temporarily
    $("#signup_button").attr("disabled", "disabled")

    req.done (data, textStatus, jqXHR) =>
      # Login
      @login(username, password)
    req.fail (jqXHR, textStatus, errorThrown) =>
      $("#signup_button").removeAttr('disabled')
      console.error "Signup failure: #{jqXHR.responseText} (#{jqXHR.status})"
      if jqXHR.status < 500 and jqXHR.status >= 400 and jqXHR.status != 404 # 404 means no connection sometimes
        alert(JSON.parse(jqXHR.responseText).error)
      else
        alert(T("Unable to signup. Please check that you are connected to Internet"))

    return

  login: (username, password) ->
    success = =>
      @pager.closeAllPages(MainPage)
      @pager.flash T("Login as {0} successful", username), "success"

    error = =>
      $("#login_button").removeAttr('disabled')

    # Disable button temporarily
    $("#login_button").attr("disabled", "disabled")

    utils.login(username, password, @ctx, success, error)
