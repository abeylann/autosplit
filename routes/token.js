// receive token and store in stripe

const express = require('express');
const router = express.Router();
const Stripe = require('stripe')('sk_test_hsoiKbJpKQnIyjrJgwVdSkJy');
const Bluebird = require('bluebird');
const Firebase = require('firebase');
const firebaseAuth = require('../private/firebase_auth.js');

Firebase.initializeApp(firebaseAuth);

const db = Firebase.database();
const ref = db.ref("users");

module.exports = router;

router.post('/', (req, res, next) => {
	const requiredKeys = ['routing', 'account','ssn','fullName', 'email', 'date', 'uid'];
	const isValid = requiredKeys.reduce((prev, curr) => {
		return prev && req.body.hasOwnProperty(curr);
	}, true)

	if (!isValid) {
		return res.status(400).send({statusText: 'Missing keys!'});
	}
	Stripe.tokens.create({
	  bank_account: {
	    country: 'US',
	    currency: 'usd',
	    account_holder_name: `${req.body.fullName}`,
	    account_holder_type: 'individual',
	    routing_number: `${req.body.routing}`,
	    account_number: `${req.body.account}`
	  }
	}, function(err, token) {
	  if(err) {
	  	console.error(err)
	  	return res.status(400).send(err);
	  } 
	  if(token) {
	  	const bankAccountInfo = token.id;

	  	Stripe.accounts.create({
	  		managed: 'true',
	  		country: 'US',
	  		email: req.body.email
	  	}, function(err, account) {
	  		if(err) {
	  			console.error(err)
	  			return res.status(400).send(err);
	  		}
	  		if(account) {
	  			const keys = account.keys;
	  			const accountId = account.id
	  			const dateOfBirth = new Date(req.body.date);

	  			Stripe.accounts.update(accountId, {
	  				external_account: bankAccountInfo,
	  				legal_entity: {
	  					dob: {
		  					day: dateOfBirth.getDate(),
		  					month: dateOfBirth.getMonth() + 1,
		  					year: dateOfBirth.getFullYear(),
	  					},
	  					first_name: req.body.fullName.split(' ')[0],
	  					last_name: req.body.fullName.split(' ')[1]
	  				},
	  				tos_acceptance: {
	  					date: Math.floor(Date.now()/1000),
	  					ip: req.connection.remoteAddress
	  				}
	  			}, function(err, account) {
	  				if(err) {
	  					console.error(err);
	  					return res.status(400).send(err);
	  				}
	  				if(account) {
	  					const userRef = ref.child(req.body.uid);
	  					userRef.update({
	  						stripeSk: keys.secret,
	  						stripePk: keys.publishable,
	  						bankAccountToken: bankAccountInfo
	  					})
	  					.then(() => {
	  						console.log('sending back!')
	  						return res.status(200).send();
	  					})
	  					.catch(err => {
	  						console.error(err)
	  						return res.status(400).send(err);
	  					})
	  				}
	  			})
	  		}
	  	})
	  }
	});
});