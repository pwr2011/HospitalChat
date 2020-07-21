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
        const query = `select * from aim where userId = '${userNum}'`;
        console.log(query);
        return await client.query(query);
    }

    async queryInsertAim(entities,userName,context) { //목표 넣기
        console.log("queryInsertSchedule 진입");
        //if(entities.AimyStartTime.realTime_hour.realTime ===) 존재하지 않는다면 현시간

        const query = `
        INSERT INTO aim
        (userId, context, startTimeMonth, startTimeDay,
            endTimeMonth,endTimeDay,achieveCount,achieveCycle, curCycleCount) VALUES
        ('${userName}', '${context}',
        ${entities.startTime_month},
        ${entities.startTime_day},
        ${entities.endTime_month},
        ${entities.endTime_day},0,
        ${entities.timeCycle},0);`;
        
        return await client.query(query);

    }
    
    async queryDeleteAim(aimNumber,userName){ //목표 삭제
        console.log("queryDeleteAim 진입");
        //지우려는 목표가 목표방에 있는 목표라면 headId가 나의 Id가 같은지 확인한다.
        //그리고 내가 방장이라면 목표방에 있는 모든 사람들의 해당목표를 삭제한다
        //구현해야함.
        const query1 = `select * from aim where aimId = ${aimNumber}`;
        const query2 = `delete from aim where aimId = ${aimNumber} and userId = '${userName}'`;
        return await client.query(query);

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
        console.log('queryRoomInfo 진입!');
        const getInfoQuery = `select context, achieveCycle from room where roomId = ${roomNum}`;

        return await client.query(getInfoQuery);
    }
    async queryJoinRoom(userName, roomNum,roomContext, roomCycle){
        console.log('queryJoinRoom 진입!');
        
        const query = `update room set enteredId = array_append(enteredId,'${userName}')
        where roomId = ${roomNum};
        insert into aim (userId, context, achieveCount, achieveCycle, curCycleCount)
        values ('${userName}', '${roomContext}',0,${roomCycle},0)`;
        return await client.query(query);
    }

    async queryMakeRoom(roomContext, roomCycle, roomHead) {
        console.log('queryMakeRoom 진입!');
        const query1 = //목표방에서는 일정이 사용되지 않기에 일단 안집어넣음
            `insert into room (headId, context, achieveCycle,enteredId)
          values ('${roomHead}', '${roomContext}',${roomCycle},'{${roomHead}}');`
        const query2 = `select * from room where headId = '${roomHead}' and context = '${roomContext}'`;
        
        await client.query(query1);
        
        //새로생긴 룸 넘버를 알기위한 중간쿼리
        var res = await client.query(query2);
        console.log(res.rows[0]);
        const newRoomNum = res.rows[0].roomid;
        console.log(newRoomNum)

        //Aim테이블에 방장의 id에 본 목표를 넣음.
       const query3 =
        `insert into aim (userId, context,roomId, achieveCount, achieveCycle, curCycleCount)
         values ('${roomHead}', '${roomContext}',${newRoomNum},0,${roomCycle},0)`;
       
        await client.query(query3);
        }
    
}
module.exports.DB = DB;