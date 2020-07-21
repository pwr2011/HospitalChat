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

    
    async queryShowAim(userNum){ //userNum이 가지고 있는 모든 목표 보여주기
        console.log("queryShowAim 진입!");
        const query = `select * from aim where userId = userNum`;
        return await client.query(query);
    }
    async queryInsertAim() { //목표 넣기
        console.log("queryInsertSchedule 진입");
        //if(entities.AimyStartTime.realTime_hour.realTime ===) 존재하지 않는다면 현시간

        const query = `
        INSERT INTO plan
        (aimId,userId, context, startTimeMonth, startTimeDay,
            endTimeMonth,endTimeDay,achieveCount,achieveCycle, curCycleCount) VALUES

        (${entities.AimyContext}, ${entities.AimyStartTime.realTime_month.realTime},
        ${entities.AimyStartTime.realTime_day.realTime},
        ${entities.AimyStartTime.realTime_hour.realTime},
        ${entities.AimyEndtime.realTime_month.realTime},
        ${entities.AimyEndtime.realTime_day.realTime},
        ${entities.AimyEndtime.realTime_hour.realTime},
        ${entities.AimyWakeUp.realTime_hour.realTime},
        ${entities.AimyWakeUp.realTime_minute.realTime});`;

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

    queryModifyAim(){//목표 수정


    }

    async queryShowAllRoom(){
        console.log('queryShowAllRoom 진입!');
        const query = `select * from room`;
        return await client.query(query);
    }
    async queryRoomEnter(userName,roomNum){ // roomNum방으로 들어가기
        console.log('queryShowRoomEntered 진입!');
        const query = `update room set enteredId = array_append(enteredId,'${userName}')
        where roomId = ${roomNum}`;
        await client.query(query);
    }
    async queryShowAchievePercentage(){}

    async queryRoomInfo(roomNum){
        console.log(roomNum);
        console.log('queryRoomInfo 진입!');
        const getInfoQuery = `select context, achieveCycle from room where roomId = ${roomNum}`;

        return await client.query(getInfoQuery);
    }
    async queryJoinRoom(userName, roomNum,roomContext, roomCycle){
        console.log('queryJoinRoom 진입!');
        console.log(userName);
        console.log(roomNum);
        console.log(roomContext);
        console.log(roomCycle);
        
        const query = `update room set enteredId = array_append(enteredId,'${userName}')
        where roomId = ${roomNum};
        insert into aim (userId, context, achieveCount, achieveCycle, curCycleCount)
        values ('${userName}', '${roomContext}',0,${roomCycle},0)`;
        return await client.query(query);
        /*await client
            .query(query)
            .then(() => {
                console.log('queryJoinRoom Completed!!');
                //client.end(console.log('Closed client connection'));
            })
            .catch(err => console.log(err))
            .then(() => {
                //console.log('Finished execution, exiting now');
                //process.exit();
            });*/
    }

    async queryMakeRoom(roomContext, roomCycle, roomHead) {
        console.log('queryMakeRoom 진입!');
        const query = //목표방에서는 일정이 사용되지 않기에 일단 안집어넣음
            `insert into room (headId, context, achieveCycle,enteredId)
          values ('${roomHead}', '${roomContext}',${roomCycle},'{${roomHead}}');
          insert into aim (userId, context, achieveCount, achieveCycle, curCycleCount)
          values ('${roomHead}', '${roomContext}',0,${roomCycle},0)`;
        console.log(query);
        client
            .query(query)
            .then(() => {
                console.log('Make Room Completed!');
                //client.end(console.log('Closed client connection'));
            })
            .catch(err => console.log(err))
            .then(() => {
                //console.log('Finished execution, exiting now');
                //process.exit();
            });
        }
    
}
module.exports.DB = DB;