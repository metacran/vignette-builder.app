var debug = require('debug');
var handle_package = require('./lib/handle_package');
var amqp = require('amqplib');

function run() {

    var broker_url = process.env.RABBITMQ_URL || 'amqp://localhost';
    var q = 'vignette';

    amqp.connect(broker_url).then(function(conn) {
	process.once('SIGINT', function() { conn.close(); });
	return conn.createChannel().then(function(ch) {
	    var ok = ch.assertQueue(q, {durable: true});
	    ok = ok.then(function() { ch.prefetch(1); });
	    ok = ok.then(function() {
		ch.consume(q, do_work, { noAck: false });
	    });
	    return ok;

	    function do_work(msg) {
		var msg_obj = JSON.parse(msg.content.toString());
		console.log(msg_obj.package + " start.");
		
		handle_package(msg_obj, function(err, result) {
		    if (err) {
			console.log(msg_obj.package + " error:")
			console.log(err)
		    } else {
			console.log(msg_obj.package + " done")
		    }
		    return ch.ack(msg);
		})
	    }
	})
    }).then(null, console.warn);
}

module.exports = run;
