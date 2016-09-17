// receive token and store in stripe

const express = require('express');
const router = express.Router();
const Stripe = require('stripe')('sk_test_hsoiKbJpKQnIyjrJgwVdSkJy');
const Bluebird = require('bluebird');
module.exports = router;

router.post('/', (req, res, next) => {
	console.log(req.body)
	const requiredKeys = ['routing', 'account','ssn','fullName', 'email', 'date'];
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
	  	console.log(token)
	  	const bankAccountInfo = token.bank_account

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
	  			// console.log(account)
	  			const keys = account.keys;
	  			const accountId = account.id
	  			const externalAccounts = account.external_account;
	  			
	  			externalAccounts.data.push(bankAccountInfo)

	  			stripe.accounts.update(accountId, {
	  				externalAccounts: externalAccounts,
	  				display_name: req.body.fullName,
	  				legal_entity: {
	  					day: dob.getDate(),
	  					month: dob.getMonths()+1,
	  					year: dob.getFullYear()
	  				},
	  				tos_acceptance: {
	  					date: Math.floor(Date.now()/1000),
	  					ip: req.connection.remoteAddress
	  				}
	  			}, function(err, account) {

	  			})
	  			return res.status(200);
	  		}
	  	})
	  }
	});
});