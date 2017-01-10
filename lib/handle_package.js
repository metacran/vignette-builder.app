var array_uniq = require('array-uniq');
var marky = require("marky-markdown");
var gh_list = require('../lib/gh_list');
var gh_contents = require('../lib/gh_contents');

function handle_package(msg_obj, callback) {

    // Need to list files in the package, from GitHub
    gh_list('cran/' + msg_obj.package, 'vignettes', function(err, list) {
	if (err) { callback(err); return; }

	// Vignette folder contents
	var vignette_files = list.filter(function(item) {
	    return /^vignettes\/[^\/]*\.(Rmd|Rnw|md)$/i.test(item);
	});
	var vignettes = preferred_vignettes(vignette_files);

	// TODO: queue Rmd

	// TODO: do proper Rnw instead of linking
	for (i in vignettes.Rnw) {
	    do_rnw_vignette(msg_obj.package, vignettes.Rnw[i])
	}

	// md
	for (i in vignettes.md) {
	    do_md_vignette(msg_obj.package, vignettes.md[i])
	}

	console.log(vignettes)
	
	callback(null, "OK");

    })    
}

function do_rnw_vignette(package, vignette) {
    
}

function do_md_vignette(package, vignette) {
    gh_contents('cran/' + package, vignette, function(err, file) {

	var package = {
	    name: package,
	    repository: {
		type: 'git',
		url: 'https://github.com/cran/' + package + '.git'
	    }
	};

	var html = marky(file, { package: package }).html();
	put_in_db(package, vignette, 'md', html);
    })
}

function put_in_db(package, vignette, type, text) {

}

function preferred_vignettes(vignette_files) {

    var without_ext = vignette_files.map(function(x) {
	return x.replace(/\.[^\.]*$/, '');
    })
    without_ext = array_uniq(without_ext);
    
    var vignettes = { 'md': [],
		      'Rmd': [],
		      'Rnw': [] };
    
    // Prefer md over Rmd over Rnw
    for (v in without_ext) {
	var vv = without_ext[v];
	if (vignette_files.indexOf(vv + '.md') >= 0) {
	    vignettes.md.push(vv + '.md')
	} else if (vignette_files.indexOf(vv + '.Rmd') >= 0) {
	    vignettes.Rmd.push(vv + '.Rmd')
	} else if (vignette_files.indexOf(vv + '.Rnw') >= 0) {
	    vignettes.Rnw.push(vv + '.Rnw')
	}
    }

    return vignettes;
}

function queue_this(type, item) {
    var q = type;

    amqp.connect(broker_url).then(function(conn) {
	return when(conn.createChannel().then(function(ch) {
	    var ok = ch.assertQueue(q, { durable: true });

	    var entry = { 'package': item,
			  'added_at': new Date().toISOString(),
			  'added_by': 'docs.app' };

	    return ok.then(function() {
		var msg = JSON.stringify(entry);
		ch.sendToQueue(q, new Buffer(msg), { deliveryMode: true });
		return ch.close();
	    });
	})).ensure(function() { conn.close(); });
    }).then(null, console.warn);
}

module.exports = handle_package;
