const pg = require('pg');

const config = {
    host: 'team27-server.postgres.database.azure.com',
    user: 'inha16@team27-server',
    database: 'AIMY',
    password: 'dlsgkeo16!',
    port: 5432,
    ssl: true
};

const client = new pg.Client(config);

class DB {
    constructor() {
        client.connect(err => {
            if (err) throw err;
            else {
                console.log("연결 성공!")
                //this.queryResult();
            }
        });

    }

    queryDatabase(){
        const query = `
        DROP TABLE IF EXISTS inventory;
        CREATE TABLE inventory (id serial PRIMARY KEY, name VARCHAR(50), quantity INTEGER);
        INSERT INTO inventory (name, quantity) VALUES ('banana', 150);
        INSERT INTO inventory (name, quantity) VALUES ('orange', 154);
        INSERT INTO inventory (name, quantity) VALUES ('apple', 100);
    `;

    client
        .query(query)
        .then(() => {
            console.log('Table created successfully!');
            client.end(console.log('Closed client connection'));
        })
        .catch(err => console.log(err))
        .then(() => {
            console.log('Finished execution, exiting now');
            //process.exit();
        });
    }

    queryResult() {
        const query = `select * from plan`;
    
        client.query(query)
            .then(res => {
                const rows = res.rows;
                rows.map(row => {
                    console.log(`Read: ${JSON.stringify(row)}`);
                });
    
                //process.exit();
            })
            .catch(err => {
                console.log(err);
            });
    }
    
}
module.exports.DB = DB;