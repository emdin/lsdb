# LSDB.js
Lightweight database and ORM layer for the LocalStorage-enabled browsers

## Quick start

1. Include lsdb.js to your app
2. Create new connection
    var db = new dbb({ dbname: 'db_demo' });
3. Insert record:
    db.insert('users', { name: 'Engelbert', lastname: 'Humperdinck' });
4. Select record:
    db.select('users'); 
    =>
5. Update record:
    db.update('users', { name: 'Zingelbert', lastname: 'Bembledack' }, 1); 
6. Drop table:
    db.drop('users'); 


