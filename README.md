# Boxrec-Pull
Allows for information about a boxer to be pulled from the online boxing database, Boxrec.

## The purpose of my fork
My forks goal is to compare two boxers, participating in one fight identified by date.

Also, my fork gets more data to make fair comparison:
- name
- nickname
- record (w, l, d)
- rating (%)
- ranking (world and local)
- birthday
- age

## Installation
```sh
npm install Maxim-Mazurok/boxrec-pull --save
```

## Usage
```js
var boxrec = require('boxrec-pull');

boxrec.findById(356831, function(err, boxer) {
  console.log(boxer.name); // 'Gennady Golovkin'
});

boxrec.findByName('Carl Froch', function(err, boxer) {
  console.log(boxer.nickname); // 'The Cobra'
});

boxrec.findByFight('Fred Evans', 'Najim Fennan', new Date(Date.UTC(2017, 4, 26)).getTime(), function(err, fight) {
    console.log(fight);
    /**
    [ { name: 'Fred Evans',
        nickname: '',
        record: { w: 0, l: 0, d: 0 },
        rating: null,
        ranking: 
           { world: { rank: null, total: null },
             local: { rank: null, total: null, country_code: null } },
        birthday: '1991-02-04',
        age: 26 },
      { name: 'Najim Fennane',
        nickname: '',
        record: { w: 1, l: 1, d: 0 },
        rating: '10%',
        ranking: 
           { world: { rank: 769, total: 1802 },
             local: { rank: 3, total: 6, country_code: 'BE' } },
        birthday: '1985-09-02',
        age: 31 } ]
    **/
});

```
## Notes
It seems like boxrec have access limits for unregistered users. So, if script stops working, try to open boxrec in your browser. If it says "Please login to continue" on every page - seems like you are over limit. You can tweak COOKIE and UA variable in source code to get access to boxrec again.

## Tests
```sh
npm test
```
