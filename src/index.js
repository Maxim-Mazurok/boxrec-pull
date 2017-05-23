const request = require('request');
const http = require('http');
const querystring = require('querystring');
const cheerio = require('cheerio');

/* SET THEM IF YOU ARE OVER NO-LOGIN LIMIT */
const UA = '';
const COOKIE = '';

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
        rating: $('span.starRatingLarge').length > 0 ? parseInt($('span.starRatingLarge').attr('style').split(':')[1].trim()) + '%' : null,
        ranking: {
            world: {
                rank: $('div.flag.world[title="World"] + div > a').length > 0 ? parseInt($('div.flag.world[title="World"] + div > a').text().trim().split(',').join('').split(' / ')[0]) : null,
                total: $('div.flag.world[title="World"] + div > a').length > 0 ? parseInt($('div.flag.world[title="World"] + div > a').text().trim().split(',').join('').split(' / ')[1]) : null
            },
            local: {
                rank: $('div.flag:not(.world) + div > a').length > 0 ? parseInt($('div.flag:not(.world) + div > a').text().trim().split(',').join('').split(' / ')[0]) : null,
                total: $('div.flag:not(.world) + div > a').length > 0 ? parseInt($('div.flag:not(.world) + div > a').text().trim().split(',').join('').split(' / ')[1]) : null,
                country_code: $('div.flag:not(.world) + div > a').length > 0 ? $('div.flag:not(.world)').first().attr('class').split(/\s+/)[1].toUpperCase() : null
            }
        },
        birthday: $('span[itemprop="birthDate"]').length > 0 ? $('span[itemprop="birthDate"]').text() : null,
        age: $('span[itemprop="birthDate"]').length > 0 ? _calculateAge(Date.parse($('span[itemprop="birthDate"]').text())) : null
    };
}

function extractScheduleInfo(data) {
    var $ = cheerio.load(data);
    var ret = [];
    var schedule_elem = null;

    $('h2.pageTitle').each(function() {
        if ($(this).text().trim().toLowerCase() === 'schedule' && schedule_elem === null) {
            schedule_elem = $(this);
        }
    });

    if (schedule_elem !== null) {
        $(schedule_elem).next().find('.tBoutList').each(function () {
            var date = Date.parse($(this).find('td.profileDateWidth > a.dLink').text().trim());
            var name = $(this).find('.boxerLink').text().trim();
            var link = $(this).find('.boxerLink').attr('href');
            var id = parseInt(link.substr(link.indexOf('boxer/') + 'boxer/'.length));
            ret.push({
                id: id,
                name: name,
                date: date
            })
        })
    }

    return ret;
}

function extractInfoFromSearch(data) {
    var $ = cheerio.load(data);
    var ret = [];

    $('.tBoutList').each(function () {
        var name = $(this).find('tr.bTop > td > a.boxerLink').text().trim();
        var link = $(this).find('tr.bTop > td > a.boxerLink').attr('href');
        var id = parseInt(link.substr(link.indexOf('boxer/') + 'boxer/'.length));
        ret.push({
            id: id,
            name: name
        })
    });

    return ret;
}

module.exports = {
    findById: function (id, cb) {
        request({
            headers: {
                'Cookie': COOKIE,
                'User-Agent': UA
            },
            uri: 'http://boxrec.com/boxer/' + id
        }, function (err, response, body) {
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
    },

    findAllByName: function(name, cb) {
        var post_data = querystring.stringify({
            'status': 'all',
            'search_text' : name
        });
        var post_options = {
            host: 'boxrec.com',
            port: '80',
            path: '/search/do_search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(post_data),
                'Cookie': COOKIE,
                'User-Agent': UA
            }
        };
        var post_req = http.request(post_options, function(res) {
            res.setEncoding('utf8');
            var body = '';
            res.on('data', function(d) {
                body += d;
            });
            res.on('end', function() {
                return cb(null, extractInfoFromSearch(body));
            })
        });

        post_req.write(post_data);
        post_req.end();
    },

    getScheduleById: function (id, cb) {
        request({
            headers: {
                'Cookie': COOKIE,
                'User-Agent': UA
            },
            uri: 'http://boxrec.com/boxer/' + id
        }, function (err, response, body) {
            return cb(null, extractScheduleInfo(body));
        });
    },

    findByFight: function(name1, name2, date, cb) {
        module.exports.findAllByName(name1, function(error, boxers) {
            boxers.forEach(function (boxer) {
                module.exports.getScheduleById(boxer.id, function (error, schedule) {
                    schedule.forEach(function (fight) {
                        if ((
                            fight.name.toLowerCase().indexOf(name2.toLowerCase()) > -1
                            || name2.toLowerCase().indexOf(fight.name.toLowerCase()) > -1
                            || fight.name.toLowerCase().split(' ')[0].indexOf(name2.toLowerCase().split(' ')[0]) > -1
                            || name2.toLowerCase().split(' ')[0].indexOf(fight.name.toLowerCase().split(' ')[0]) > -1
                            || fight.name.toLowerCase().split(' ')[1].indexOf(name2.toLowerCase().split(' ')[1]) > -1
                            || name2.toLowerCase().split(' ')[1].indexOf(fight.name.toLowerCase().split(' ')[1]) > -1
                        ) && Math.abs(fight.date - date) <= 1000 * 60 * 60 * 24) {
                            module.exports.findById(boxer.id, function (error, data1) {
                                module.exports.findById(fight.id, function (error, data2) {
                                    return cb(null, [data1, data2]);
                                })
                            })
                        }
                    })
                });
            })
        })
    }
};