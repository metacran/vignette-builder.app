var gh_got = require('gh-got');

var gh_token = process.env.GH_TOKEN || null;

function gh_list(repo, path, callback) {
    gh_got('repos/' + repo + '/contents/' + path, { 'token': gh_token },
	   function(err, list) {
	       if (err) { callback(err); return; }
	       var files = list.map(function(x) { return x.path; });
	       callback(null, files);
	   })
}

module.exports = gh_list;
