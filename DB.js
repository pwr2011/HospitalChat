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

var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
var month = moment().format('MM');
var day = moment().format('DD');
var hour = moment().format('HH');
var minute = moment().format('mm');

class DB {
    constructor() {
        client.connect(err => {
            if (err) throw err;
            else {
                console.log("연결 성공!");
            }
        });
    }

    queryInsertAim(){ //목표 넣기

    }
    queryInsertSchedule(entities){ //일정 넣기
        console.log("queryInsertSchedule Function 진입");
        //if(entities.AimyStartTime.realTime_hour.realTime ===) 존재하지 않는다면 현시간
        const query = `
        INSERT INTO plan 
        (context, start_time_month, start_time_day, start_time_hour,
            end_time_month,end_time_day,end_time_hour,
            wake_up_hour,wake_up_minute) VALUES
            
            ('공부','3','4','8',
            '3','4','9',
            '1','10');
    `;

    /*(${entities.AimyContext}, ${entities.AimyStartTime.realTime_month.realTime},
        ${entities.AimyStartTime.realTime_day.realTime},
        ${entities.AimyStartTime.realTime_hour.realTime},
        ${entities.AimyEndtime.realTime_month.realTime},
        ${entities.AimyEndtime.realTime_day.realTime},
        ${entities.AimyEndtime.realTime_hour.realTime},
        ${entities.AimyWakeUp.realTime_hour.realTime},
        ${entities.AimyWakeUp.realTime_minute.realTime});*/
    client
        .query(query)
        .then(() => {
            console.log('Schedule Inserted!');
            //client.end(console.log('Closed client connection'));
        })
        .catch(err => console.log(err))
        .then(() => {
            console.log('Finished execution, exiting now');
            //process.exit();
        });
    }
    queryDeleteAim(){

    }
    queryDeleteSchedule(){
        
    }

    queryDatabase(){
        const query = ``;

    client
        .query(query)
        .then(() => {
            console.log('Table created successfully!');
            //client.end(console.log('Closed client connection'));
        })
        .catch(err => console.log(err))
        .then(() => {
            //console.log('Finished execution, exiting now');
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