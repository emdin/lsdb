# lsdb.js
Lightweight database and ORM layer for the LocalStorage-enabled browsers

## Quick start

Download and include lsdb.js to your app

    <script type="text/javascript" src="[yourpath]/lsdb.js"></script>

Create new connection

    var db = new dbb({ dbname: 'db_demo' });

Insert record:

    db.insert('users', { name: 'Engelbert', lastname: 'Humperdinck' });

Select record:

    db.select('users'); 

Update record:

    db.update('users', { name: 'Zingelbert', lastname: 'Bembledack' }, 1); 

Drop table:

    db.drop('users'); 

## Why?

I used it mostly for the rich UI prototypes. On prototyping stage, all database interaction is done via 
lsdb.js layer, which then can be easily replaced by the real ORM. But of course, you can build a real-world
stateful client-side applications with it as well.

## Reduce pattern

You can use reduce-style callbacks for almost every lsdb.js operation.

Retrieving only adults

    db.select('users', function(rec) {
        return rec.age > 17; 
    }); 

Updating only Engelberts

    db.update('users', { new_field: 'I am the Moon' }, function(rec) { 
        return (rec.name == 'Engelbert')
    });

## API in examples

### Create connection                                  

    var db = new lsdb({ dbname: 'db_demo' }); 

### Insert single record

    db.insert = function( 'users', { name: 'Engelbert', lastname: 'Humperdinck' } );

### Insert several records

    db.insert( 'users', [
            { name: 'Yingybert', lastname: 'Dambleban' },  
            { name: 'Wengelbert', lastname: 'Humptyback' } 
        ] );

### Update records

    db.update('users', { new_field: 'I am the Moon' }, 1); // update record with id = 1

or

    db.update('users', { new_field: 'I am the Moon' }, [ 1, 2 ] ); // update several records 

or

    db.update('users', { new_field: 'I am the Moon' }, function(rec) { // update via reduce callback
        return (rec.name == 'Engelbert')
    });

### Select records

    db.select_all('users');

=>

    Object
        1: Object
            id: 1
            lastname: "Dambleban"
            name: "Yingybert"
            new_field: "I'm the Moon"
        2: Object
            id: 2
            lastname: "Humptyback"
            name: "Wengelbert"

or

    db.select_all('users', 'array'); // will produce the array instead of object

or

    db.select('users', 1); // select single record by id

or

    db.select('users', [ 1, 2 ], 'array' ); // select several records by ids as array

or

    db.select('users', function(rec) {
        return rec.new_field; // return only records with the certain field set
    }); // select records via reduce

### Remove records 

    db.remove('users', [ 1, 2 ]);

or

    db.remove('users', function(rec) {
        return rec.new_field; // remove only records with the certain field set
    }); // select records via reduce

### Drop table 

    db.drop('users');

## Working with ORM 

### Models

To start working with the ORM layer you should define your models: 

    var User = {
        table: 'users', // table name
        fields: [ 'id', 'name', 'lastname' ], // fields
        associations: [ // array of associations
            { type: 'hasMany', model: 'Project', name: 'projects' }
        ]
    };

    var Project = {
        table: 'projects', // table name
        fields: [ 'id', 'title', 'description' ], // fields
        associations: [ // array of associations
            { type: 'hasOne', model: 'User', name: 'user' }
        ]
    };

    db.orm_init( { models: { 'Project': Project, 'User': User } } ); 

### Create new record(s)

    db.orm_save('User', { name: 'Howard', lastname: 'Moon' });

or 

    db.orm_save('User', [ 
        { name: 'Howard', lastname: 'Moon' },
        { name: 'Vincent', lastname: 'Noire' }
    ]);

### Update record(s)

    db.orm_save('User', { name: 'Howard', lastname: 'Moon', id: 1 });

or (update and create in one command)

    db.orm_save('User', [ 
        { name: 'Howard', lastname: 'Moon', id: 1 },  
        { name: 'New', lastname: 'Gregg' } 
    ]);


### Create new associated record(s)

    var id = db.orm_save('User', { name: 'Vincent', lastname: 'Noire' } );
    db.orm_save( 'Project', [ 
        { title: 'Make up the hair', user: id },
        { title: 'Be gorgeous', user: id } 
    ]);

### Retrieve record(s)

    var users = db.orm_load( 'User' );

=>

    Object
        id: 3
        lastname: "Noire"
        name: "Vincent"
        projects: Array[2]
            0: Object
                id: 1
                title: "Make up the hair"
            1: Object
                id: 2
                title: "Be gorgeous"

All associated recors will also be retrieved. 

### Remove record

    db.orm_remove( 'User', [1, 3] );

or

    db.orm_remove( 'User', function(rec) { return rec.lastname=='Noire' } );
