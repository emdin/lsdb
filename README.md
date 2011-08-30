# LSDB.js
Lightweight database and ORM layer for the LocalStorage-enabled browsers

## Quick start

Include lsdb.js to your app 

    <script type="text/javascript" src="[yourpath]lsdb.js"></script>

Create connection:   
    
    var db = new dbb({ dbname: 'db_demo' }); // Create new connection

Insert record:

    db.insert('users', { name: 'Engelbert', lastname: 'Humperdinck' });
  
Select records:

    db.select('users'); 

Update record:

    db.update('users', { name: 'Zingelbert', lastname: 'Bembledack' }, 1); 
    
Drop table:

    db.drop('users'); 


