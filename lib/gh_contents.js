var gh_got = require('gh-got');

var gh_token = process.env.GH_TOKEN || null;

function gh_contents(repo, path, callback) {

    gh_got('repos/' + repo + '/contents/' + path, { 'token': gh_token },
	   function(err, contents) {
	       if (err) { callback(err); return; }
	       var str = new Buffer(contents.content, 'base64').toString('utf8');
	       callback(null, str);
	   })
    
}

module.exports = gh_contents;
