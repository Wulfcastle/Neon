var ES = require('./email-settings');
var EM = {};
module.exports = EM;
var api_key = 'key-7d9a6aff472bb29ba197b7ec5de0e870';
var domain = 'mg.whitjack.me';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
var sha256 = require("sha256");
var fs = require('fs');




EM.dispatchResetPasswordLink = function(account, callback)
{
	var data = {
          html: EM.composePasswordResetEmail(account),
	  from: 'pegasi@whitjack.me',
	  to: account.email,
	  subject: 'Hello'
	};

	mailgun.messages().send(data, callback );
}

EM.composePasswordResetEmail = function(o)
{
	var link = 'http://pegasi.whitjack.me/reset-password?e='+o.email+'&p='+o.pass;
	var html = "<html><body>";
		html += "Hi "+o.name+",<br><br>";
		html += "Your username is :: <b>"+o.user+"</b><br><br>";
		html += "<a href='"+link+"'>Please click here to reset your password</a><br><br>";
		html += "Cheers!<br>";
		html += "</body></html>";
	return  html;
}

EM.dispatchActivationLink = function(email, code, callback)
{
        var data = {
          html: EM.composeActivationEmail(email,code),
          from: 'pegasi@whitjack.me',
          to: email,
          subject: 'Hello'
        };

        mailgun.messages().send(data, callback );
}

EM.composeActivationEmail = function(email, code)
{
	var link = 'http://pegasi.whitjack.me/activation?c='+code;
	var html = "<html><body>";
	html += "Hi "+email+",<br><br>";
	html += "<a href='"+link+"'>Please click here to activate your account</a><br><br>";
	html += "Cheers!<br>";
	html += "</body></html>";
	return html;
}

EM.dispatchLicense = function(email, license, callback)
{
  var dapath = '/etc/attach/' + sha256(license);
  fs.writeFileSync(dapath, license);
  var file = fs.readFileSync(dapath);
  var attch = new mailgun.Attachment({data: file, filename: sha256(license)+".txt"});
  var data = {
    html: EM.composeLicense(email,license),
    from: 'pegasi@whitjack.me',
    to: email,
    subject: 'Hello',
    attachment: attch
  };

  mailgun.messages().send(data, callback );
}

EM.composeLicense = function(email, license)
{
  var html = "<html><body>";
  html += "Hi "+email+",<br><br>";
  html += "Your license is <br><br><pre>" + license + "</pre><br><br>";
  html += "Cheers!<br>";
  html += "</body></html>";
  return html;
}
