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
        
        const query=`
        INSERT INTO plan
        (context, start_time_month, start_time_day, start_time_hour,
            end_time_month,end_time_day,end_time_hour,
            wake_up_hour,wake_up_minute) VALUES

        (${entities.AimyContext}, ${entities.AimyStartTime.realTime_month.realTime},
        ${entities.AimyStartTime.realTime_day.realTime},
        ${entities.AimyStartTime.realTime_hour.realTime},
        ${entities.AimyEndtime.realTime_month.realTime},
        ${entities.AimyEndtime.realTime_day.realTime},
        ${entities.AimyEndtime.realTime_hour.realTime},
        ${entities.AimyWakeUp.realTime_hour.realTime},
        ${entities.AimyWakeUp.realTime_minute.realTime});
        `;

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
    
    queryDeleteAim(){ //목표 삭제

    }
    queryDeleteSchedule(){//스케줄 삭제
        
    }

    queryModifyAim(){//목표 수정


    }
    
    queryModifySchedule(){ //스케줄 수정


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

    async queryShowRoomEntered(){

    }
    async queryShowAchievePercentage(){}
    async queryJoinRoom(roomNum){}
    async queryMakeRoom(roomInfo){}
    async queryResultSchedule() {//스케줄 보여주는 함수
        const query = `select * from plan`;
    
        return await client.query(query);
            
       /*     .then(res => {
                return res;
                const rows = res.rows;
                rows.map(row => {
                    console.log(`Read: ${JSON.stringify(row)}`);
                });
    
                //process.exit();
            })
            .catch(err => {
                console.log(err);
            });*/
            
    }
    
    queryResultAim(){ //목표 보여주는 함수


    }
    
}
module.exports.DB = DB;