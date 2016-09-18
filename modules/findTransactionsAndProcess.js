const Firebase = require('firebase');
const firebaseAuth = require('../private/firebase_auth.js');
const Bluebird = require('bluebird');
Firebase.initializeApp(firebaseAuth);
const moment = require('moment');
const db = Firebase.database();
const transactionRef = db.ref("transactions");


const findTodaysTransactions = () => {
	transactionRef.once('value')
	.then(res => {
		const transactions = res.val();
		const todaysTransactions = [];
		Object.keys(transactions).forEach(transactionId => {
			const billAt = moment(transactions[transactionId].billAt).startOf('day');
			const today = moment().startOf('day');
			if(today.isSame(billAt)){
				todaysTransactions.push(transactions[transactionId]);
			}
		})
		const subscriptions = [];
		todaysTransactions.forEach(transaction => {
			subscriptions.push(db.ref(`subscriptions/${transaction.subscriptionId}`).once('value'));
			return Bluebird.map(subscriptions, (subscription) => {
				const sub = subscription.val()
				const payer = sub.payer;
				const recipient = sub.recipient;
				return Bluebird.join(db.ref(`users/${payer}`).once('value'), db.ref(`users/${recipient}`).once('value'), (payer, recipient) => {
					sub.populatedPayer = payer.val();
					sub.populatedRecipient = recipient.val();
					return sub;
				});
			})
			.then(populatedSubscription => {
				transaction.subscription = populatedSubscription;
				console.log(transaction)
			})
			.catch(err => {
				console.error(err)
			})
		})

		return;
	})
	.catch(err => {
		console.error(err)
		return;
	})
}

findTodaysTransactions()