var request = require('request');
var cheerio = require('cheerio');

function extractInfo(data) {
    var $ = cheerio.load(data);

    return {
        name: $('.boxerTitle').first().text().trim(),
        nickname: $('span[itemprop="alternateName"]').text(),
        record: {
            w: parseInt($('.bgwonBlock').first().text()),
            l: parseInt($('.bglostBlock').first().text()),
            d: parseInt($('.bgdrawBlock').first().text())
        },
        ranking: {
            world: {
                rank: parseInt($('div.flag.world[title="World"] + div > a').text().trim().split(',').join('').split(' / ')[0]),
                total: parseInt($('div.flag.world[title="World"] + div > a').text().trim().split(',').join('').split(' / ')[1])
            }
        }
    };
}

module.exports = {
    findById: function (id, cb) {
        request('http://boxrec.com/boxer/' + id, function (err, response, body) {
            if (typeof id !== 'number') return cb(true);
            return cb(null, extractInfo(body));
        });
    },

    findByName: function (name, cb) {
        request('http://www.google.com/search?q=' + name + '%20site%3Aboxrec.com', function (err, response, body) {
            var $ = cheerio.load(body);
            var id = $('cite').first().text().slice(17);

            request('http://boxrec.com/boxer/' + id, function (err, response, body) {
                return cb(null, extractInfo(body));
            });
        });
    }
}