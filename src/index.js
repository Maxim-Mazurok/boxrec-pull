var request = require('request');
var cheerio = require('cheerio');

// https://stackoverflow.com/a/21984136/4536543
function _calculateAge(birthday) {
    var ageDifMs = Date.now() - birthday;
    var ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

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
        rating: parseInt($('span.starRatingLarge').attr('style').split(':')[1].trim()) + '%',
        ranking: {
            world: {
                rank: parseInt($('div.flag.world[title="World"] + div > a').text().trim().split(',').join('').split(' / ')[0]),
                total: parseInt($('div.flag.world[title="World"] + div > a').text().trim().split(',').join('').split(' / ')[1])
            },
            local: {
                rank: parseInt($('div.flag:not(.world) + div > a').text().trim().split(',').join('').split(' / ')[0]),
                total: parseInt($('div.flag:not(.world) + div > a').text().trim().split(',').join('').split(' / ')[1]),
                country_code: $('div.flag:not(.world)').first().attr('class').split(/\s+/)[1].toUpperCase()
            }
        },
        birthday: $('span[itemprop="birthDate"]').text(),
        age: _calculateAge(Date.parse($('span[itemprop="birthDate"]').text()))
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