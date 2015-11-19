require('./modules/bitcoin')
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
var BM = require('./modules/bitcoin');
var stripe = require("stripe")("sk_test_WNVlA95snv1XKyDH0pZySwEH");
var sha256 = require("sha256")

module.exports = function(app) {

// main login page //

	app.get('/', function(req, res){
	// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o;
					res.redirect('/home');
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});

	app.post('/', function(req, res){
		AM.manualLogin(req.body['user'], req.body['pass'], function(e, o){
			if (!o){
				res.status(400).send(e);
			}	else{
				req.session.user = o;
				if (req.body['remember-me'] == 'true'){
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.status(200).send(o);
			}
		});
	});

// logged-in user homepage //

	app.get('/purchase', function(req, res) {
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}else{
          AM.findLicense(req.session.user.user, function(e,o) {
            if(!e && o){
             res.render('purchase', {
               title : 'Control Panel',
               udata : req.session.user,
               licenses: o
             });
            } else {
              res.render('purchase', {
                title : 'Control Panel',
                udata : req.session.user,
                licenses: "No Licenses Found"
              });
            }
          });

		}
	});

	app.get('/home', function(req, res) {
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}	else{
			res.render('home', {
				title : 'Control Panel',
				udata : req.session.user
			});
		}
	});

	app.post('/home', function(req, res){
		if (req.body['user'] != undefined) {
			AM.updateAccount({
				user 	: req.body['user'],
				name 	: req.body['name'],
				email 	: req.body['email'],
				pass	: req.body['pass'],
			}, function(e, o){
				if (e){
					res.status(400).send('error-updating-account');
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });
					}
					res.status(200).send('ok');
				}
			});
		}	else if (req.body['logout'] == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.status(200).send('ok'); });
		}
	});

// creating new accounts //
// creating new accounts //
	
	app.get('/signup', function(req, res) {
		res.render('signup', {  title: 'Signup' });
	});
	
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			email 	: req.body['email'],
			user 	: req.body['user'],
			pass	: req.body['pass']
		}, function(e,hash){
			if (e){
				res.status(400).send(e);
			}else {
				EM.dispatchActivationLink(req.body['email'], hash, function(e, m){
					// this callback takes a moment to return //
					// should add an ajax loader to give user feedback //
					if (!e) {
                        			res.status(200).send('ok');
					}else{
			                        res.status(400).send('email-server-error');
						for (k in e) console.log('error : ', k, e[k]);
					}
				});
			}
		});
	});

  app.post('/charge', function(req, res){
    var charge = stripe.charges.create({
      amount: 100, // amount in cents, again
      currency: "USD",
      source: req.body['stripeToken'],
      description: "Example charge"
    }, function(err, charge) {
      if (err) {
        res.render('license', {title: "Error", responseMessage: "Sorry, there was an error"});
      } else {
        var license = AM.makeTextLicense(req.session.user.email, "Fifa", req.session.user.user);
        EM.dispatchLicense(req.session.user.email, license, function(e, m){
          // this callback takes a moment to return //
          // should add an ajax loader to give user feedback //
          if (!e) {
          }else{
            for (k in e) console.log('error : ', k, e[k]);
          }
        });
        BM.addKey(sha256(license));
        AM.addNewLicense({key: license, user: req.session.user.user});
        res.render('license', {title: "License", responseMessage: "Thanks for the purchase!", license: license});
      }
    });
  });
// activating account //

	app.get('/activation', function(req, res) {
		if (req.param('c'))
		{
			AM.activateAccount(req.param('c'),function(e, o){
				if (o){
					res.render('activated', { title: 'Activation'});
				} else{
					res.render('activation-failed', { title: 'Activation' });
				}
			});
		} else{
			res.send("activation code required", 400);
		}
	});

// password reset //

	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.body['email'], function(o){
			if (o){
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// TODO add an ajax loader to give user feedback //
					if (!e){
						res.status(200).send('ok');
					}	else{
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				});
			}	else{
				res.status(400).send('email-not-found');
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});

	app.post('/reset-password', function(req, res) {
		var nPass = req.body['pass'];
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
				res.status(400).send('unable to update password');
			}
		})
	});

// view & delete accounts //

	app.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
				req.session.destroy(function(e){ res.status(200).send('ok'); });
			}	else{
				res.status(400).send('record not found');
			}
	    });
	});

	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');
		});
	});

  app.get('/api/check/:shash', function(req, res) {
    res.send(BM.checkKey(req.params.shash));
  });

  app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
