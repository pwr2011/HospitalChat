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
const { ConsoleTranscriptLogger } = require('botbuilder');
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
        var deadline = new Date();
        deadline.setFullYear(2020,parseInt(entities.startTime_month[0])-1,parseInt(entities.startTime_day[0]));
        console.log('변경전');
        console.log(deadline);
    
        deadline.setDate(deadline.getDate()+parseInt(entities.timeCycle[0])); //첫번째 마감일은 처음 시작일에서 시작 주기를 더한 것
  
        console.log('deadline 추가:')
        console.log(deadline);

        var trimmedDeadline = await this.trimmed(JSON.stringify(deadline));
        console.log(trimmedDeadline);
        const query = `
        INSERT INTO aim
        (userId, context, startTimeMonth, startTimeDay,
            endTimeMonth,endTimeDay,achieveCount,achieveCycle, curCycleCount,percentage, deadline) VALUES
        ('${userName}', '${context}',
        ${entities.startTime_month},
        ${entities.startTime_day},
        ${entities.endTime_month},
        ${entities.endTime_day},0,
        ${entities.timeCycle},0,0,'${trimmedDeadline}');`;
        
        console.log('추가완료');
        return await client.query(query);

    }
    
    async queryDeleteAim(aimNumber,userName){ //목표 삭제
        console.log("queryDeleteAim 진입");
        //지우려는 목표가 목표방에 있는 목표라면 headId가 나의 Id가 같은지 확인한다.
        //그리고 내가 방장이라면 목표방에 있는 모든 사람들의 해당목표를 삭제한다
        //구현완료.
        
        const query1 = `select roomId from aim where aimId = ${aimNumber}`;
        var res1 = await client.query(query1);
        const rows1 = res1.rows;
        res1=(rows1[0].roomid);
        console.log(res1);
        if(res1 == null){ //목표방에 있는 목표가 아님 -> 그 목표만 삭제
            console.log("enter 1");
            const query2 = `delete from aim where aimId = ${aimNumber}`;
            await client.query(query2);
        }
        else{ //목표방에 있는거니 목표방의 headid와 자신의 id비교
            console.log("enter 2");
            const query2 = `select headId from room where roomId = ${res1}`;
            var res2 = await client.query(query2);
            const rows2 = res2.rows;
            res2 = rows2[0].headid;
            console.log(res2);
            if(res2 == userName){  //내가 head
                console.log("enter 3");
                const query3 = `delete from aim where roomId = ${res1}`;
                await client.query(query3);
            }
            else{
                console.log("enter 4");
                const query3 = `delete from aim where aimId = ${aimNumber}`;
                await client.query(query3);
            }
        }
    }

    async queryModifyAimContext(aimId,context){//Context 수정
        console.log("queryModifyAimContext 진입");
        //if(entities.AimyStartTime.realTime_hour.realTime ===) 존재하지 않는다면 현시간
        const query = `
       UPDATE aim
            SET context = '${context}' 
            WHERE aimid =  ${aimId};

        `;
        
        return await client.query(query);
    }
    async queryModifyAimTime(aimId,entities){//기간 수정
        console.log("queryModifyAimTime 진입");
        //if(entities.AimyStartTime.realTime_hour.realTime ===) 존재하지 않는다면 현시간
        const query = `
       UPDATE aim
            SET 
            starttimemonth = ${entities.startTime_month},
            starttimeday = ${entities.startTime_day},
            endtimemonth = ${entities.endTime_month},
            endtimeday = ${entities.endTime_day} 
            
            WHERE aimid =  ${aimId};

        `;
        
        return await client.query(query);

    }
    async queryModifyAimAchievecycle(aimId,context){//Achievecycle 수정
        console.log("queryModifyAimAchievecycle 진입");
        //if(entities.AimyStartTime.realTime_hour.realTime ===) 존재하지 않는다면 현시간
        const query = `
       UPDATE aim
            SET achievecycle = ${context}
            WHERE aimid =  ${aimId};

        `;
        
        return await client.query(query);

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
 
    async queryShowRoomEntered(userName){//자신이 head인 방의 정보 불러오기
        const query = `select * from room where headId = '${userName}'`;
        return await client.query(query);
    }


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
    

        async queryGetPercentageGroup(aimNumber){
            console.log('전달한 aimNumber값');
            console.log(aimNumber);
            const query = `select achievecount, deadline, achievecycle, starttimeday,starttimemonth from aim where aimid = ${aimNumber}`;
            return await client.query(query);
        }
    
        async querySetPercentage(aimNumber,percentage){
            console.log('함수진입');
          
            
            const query = `UPDATE aim SET percentage = ${percentage} where aimid = ${aimNumber}`;
            await client.query(query);
        }

        async queryShowAchievePercentage(roomNumber){

            const query = `select percentage from aim where roomid = ${roomNumber}`;
            await client.query(query);
        }
    

        //목표 마감기한 set
        async querySetDeadline(aimNumber,deadline){
            
            console.log('querySetDeadline진입');
            console.log(deadline);

            const query = `UPDATE aim SET deadline = ${deadline} where aimId = ${aimNumber}`;
            client.query(query);
        }
        //목표 달성횟수 set
        async querySetAchieveCount(aimNumber,achieveCount){
            const query = `UPDATE aim SET achievecount = ${achieveCount} where aimId = ${aimNumber}`;
            client.query(query);

        }


        trimmed(context)
        {
            return context.substring(1,11);
        }
}
module.exports.DB = DB;