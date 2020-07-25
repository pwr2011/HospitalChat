//챗봇과 데이터베이스간의 통신을 위한 쿼리를 구현해놓은 파일이다.

//postgresql을 사용하기 위한 require
const pg = require('pg');

//postgresql server와 연결하기 위한 변수
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
        //서버와 연결되었는지 확인하기 위한 함수
        client.connect(err => {
            if (err) throw err;
            else {
                console.log("연결 성공!");
            }
        });
    }

    //userNum이 가지고 있는 모든 목표 보여주기
    async queryShowAim(userNum){ 
        const query = `select * from aim where userId = '${userNum}'`;
        return await client.query(query);
    }

    //userName에게 개인 목표 넣기
    async queryInsertAim(entities,userName,context) { 

        //deadline값을 넣기 위한 date()
        //첫번째 마감일은 처음 시작일에서 시작 주기를 더한 것
        var deadline = new Date();
        deadline.setFullYear(2020,parseInt(entities.startTime_month[0])-1,parseInt(entities.startTime_day[0]));
        deadline.setDate(deadline.getDate()+parseInt(entities.timeCycle[0])); 
        var trimmedDeadline = await this.trimmed(JSON.stringify(deadline));

        //insert query
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
        
        return await client.query(query);
    }

    //방을 지우는 쿼리
    //aim table에서 roomId가 지우려는 방과 같은 aim을 전부 삭제한다.
    async queryDeleteRoom(roomNum){
        
        const query = `delete from aim where roomid = ${roomNum};
        delete from room where roomid = ${roomNum};`;
        await client.query(query);
    }

    //지우려는 목표가 목표방에 있는 목표라면 headId가 나의 Id가 같은지 확인한다.
    //그리고 내가 방장이라면 목표방에 있는 모든 사람들의 해당목표를 삭제한다
    async queryDeleteAim(aimNumber,userName){

        const query1 = `select roomId from aim where aimId = ${aimNumber}`;
        var res1 = await client.query(query1);
        const rows1 = res1.rows;
        res1=(rows1[0].roomid);

        //목표방에 있는 목표가 아님 -> 그 목표만 삭제
        if(res1 == null){ 
            const query2 = `delete from aim where aimId = ${aimNumber}`;
            await client.query(query2);
        }

        //목표방에 있는거니 목표방의 headid와 자신의 id비교
        else{ 
            const query2 = `select headId from room where roomId = ${res1}`;
            var res2 = await client.query(query2);
            const rows2 = res2.rows;
            res2 = rows2[0].headid;

            //지금 user가 방장인 경우
            if(res2 == userName){ 
                const query3 = `delete from aim where roomId = ${res1}`;
                await client.query(query3);
            }
            else{
                const query3 = `delete from aim where aimId = ${aimNumber}`;
                await client.query(query3);
            }
        }
    }

    //Context 수정
    async queryModifyAimContext(aimId,context){
        const query = `
       UPDATE aim
            SET context = '${context}' 
            WHERE aimid =  ${aimId};
        `;
        return await client.query(query);
    }

    //기간 수정
    async queryModifyAimTime(aimId,entities){
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

    //Achievecycle 수정
    async queryModifyAimAchievecycle(aimId,context){
        const query = `
       UPDATE aim
            SET achievecycle = ${context}
            WHERE aimid =  ${aimId};
        `;        
        return await client.query(query);
    }

    //모든 방을 보여줌
    async queryShowAllRoom(){
        const query = `select * from room`;
        return await client.query(query);
    }

    // roomNum번방으로 들어가기
    async queryRoomEnter(userName,roomNum){ 
        const query0 = `select context,achieveCycle from room where roomId = ${roomNum};`;
        
        var res = await client.query(query0);
        const rows = res.rows;
        var roomContext = rows[0].context;
        var roomCycle = rows[0].achievecycle;

        var startTime = new Date();
        var deadline = new Date();
        var month = startTime.getMonth()+1;
        var date = startTime.getDate();
        deadline.setDate(date+roomCycle);
        
        const query = `update room set enteredId = array_append(enteredId,'${userName}')
        where roomId = ${roomNum};
        insert into aim (userId, context, roomid, deadline, starttimemonth, starttimeday, achieveCount, achieveCycle, curCycleCount,percentage,endtimemonth,endtimeday)
        values ('${userName}', '${roomContext}',${roomNum},'2020-${deadline.getMonth()+1}-${deadline.getDate()}',${month} , ${date}, 0 ,${roomCycle},0,0,00,00)`;
        return await client.query(query);
    }
 
    //자신이 head인 방의 정보 불러오기
    async queryShowRoomEntered(userName){
        const query = `select * from room where headId = '${userName}'`;
        return await client.query(query);
    }

    //roomNum번 방의 정보 불러오기
    async queryRoomInfo(roomNum){
        const getInfoQuery = `select context, achieveCycle from room where roomId = ${roomNum}`;

        return await client.query(getInfoQuery);
    }

    //roomNum번 방에 들어가기
    async queryJoinRoom(userName, roomNum,roomContext, roomCycle){
        var startTime = new Date();
        var deadline = new Date();
        var month = startTime.getMonth()+1;
        var date = startTime.getDate();
        deadline.setDate(date+roomCycle);
        
        const query = `update room set enteredId = array_append(enteredId,'${userName}')
        where roomId = ${roomNum};
        insert into aim (userId, context, roomid, deadline, starttimemonth, starttimeday, achieveCount, achieveCycle, curCycleCount)
        values ('${userName}', '${roomContext}',${roomNum},'2020-${deadline.getMonth()+1}-${deadline.getDate()}',${month} , ${date} ,0,${roomCycle},0)`;
        return await client.query(query);
    }

    //room만들기
    async queryMakeRoom(roomContext, roomCycle, roomHead) {
        const query1 =
            `insert into room (headId, context, achieveCycle,enteredId)
          values ('${roomHead}', '${roomContext}',${roomCycle},'{${roomHead}}');`
        const query2 = `select * from room where headId = '${roomHead}' and context = '${roomContext}'`;
        
        await client.query(query1);
        
        //새로생긴 룸 넘버를 알기위한 중간쿼리
        var res = await client.query(query2);
        const newRoomNum = res.rows[0].roomid;

        //Aim테이블에 방장의 id에 본 목표를 넣음.
       const query3 =
        `insert into aim (userId, context,roomId, achieveCount, achieveCycle, curCycleCount)
         values ('${roomHead}', '${roomContext}',${newRoomNum},0,${roomCycle},0)`;
       
        await client.query(query3);
        }
    
        //aimNumber번 방에 있는 사람들의 성취율 확인하기
        async queryGetPercentageGroup(aimNumber){
            const query = `select achievecount, deadline, achievecycle, starttimeday,starttimemonth from aim where aimid = ${aimNumber}`;
            return await client.query(query);
        }
    
        //aimNumber번 목표의 퍼센트 갱신
        async querySetPercentage(aimNumber,percentage){const query = `UPDATE aim SET percentage = ${percentage} where aimid = ${aimNumber}`;
            await client.query(query);
        }

        //aimNumber번 방에 있는 사람들의 성취율 확인하기
        async queryShowAchievePercentage(roomNumber){
            const query = `select userId, percentage from aim where roomid = ${roomNumber}`;
            return await client.query(query);
        }
    

        //목표 마감기한 설정하기
        async querySetDeadline(aimNumber,deadline){
            const query = `UPDATE aim SET deadline = ${deadline} where aimId = ${aimNumber}`;
            client.query(query);
        }

        //목표 달성횟수 설정하기
        async querySetAchieveCount(aimNumber,achieveCount){
            const query = `UPDATE aim SET achievecount = ${achieveCount} where aimId = ${aimNumber}`;
            client.query(query);
        }

        //문자열 관리하기 위한 함수
        trimmed(context)
        {
            return context.substring(1,11);
        }
}
module.exports.DB = DB;