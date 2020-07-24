const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const { LuisRecognizer } = require('botbuilder-ai');

const {database} = require('../DBconnect');

const ROOM_DIALOG='ROOM_DIALOG';

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const DATETIME_PROMPT = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = '';

//db연결

var userName;

class roomDialog extends ComponentDialog {

    constructor() {
        super(ROOM_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));


        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this), //일정,목표,스케줄 확인 중 하나 선택
            this.secondStep.bind(this),  // 추가 삭제 보기 선택
            this.thirdStep.bind(this),  // 타이핑한값을 루이스 이용 
            this.fourthStep.bind(this), //요약
            this.fifthStep.bind(this) //DB처리 부분
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

   


    async firstStep(step) {
        console.log('firstStep 진입');
        endDialog = false;
        return await step.prompt(CHOICE_PROMPT, '방 메뉴에 들어왔어요! 어떤걸 원해요?', ['참가', '생성', '삭제', '엿보기']);
    }

    async secondStep(step) {
        console.log('secondStep 진입');
        step.values.firstChoice = step.result;

        if (step.values.firstChoice.value === '참가') {
            var res = await database.queryShowAllRoom();
            const rows = res.rows;
            rows.map(row => {
                console.log(row);
                step.context.sendActivity(`${this.ShowRoomClear(row)}`);
                //console.log(this.ShowRoomClear(row));
            });
            return await step.prompt(NUMBER_PROMPT, '어떤방에 들어가시나요?');
        }
        else if (step.values.firstChoice.value === '생성') {
            return await step.prompt(TEXT_PROMPT, '방의 목표를 입력해 주세요!');
        }
        else if (step.values.firstChoice.value === '삭제') {
            database.queryShowRoomEntered(userName);
            rows.map(row => {
                step.context.sendActivity(this.ShowRoomClear(row));
                console.log(this.ShowRoomClear(row));
            });
            return await step.prompt(NUMBER_PROMPT, '몇번방을 삭제하실건가요?');
        }
        else { //엿보기
            database.queryShowRoomEntered(userName);
            rows.map(row => {
                step.context.sendActivity(this.ShowRoomClear(row));
                console.log(this.ShowRoomClear(row));
            });
            return await step.prompt(NUMBER_PROMPT, '몇번방을 엿보실건가요?');
        }

    }

    async thirdStep(step) {
        console.log('thirdStep 진입');
        step.values.secondChoice = step.result;

        if (step.values.firstChoice.value === '참가') {
            return await step.prompt(CHOICE_PROMPT, `${step.result}방에 참가합니다!`,['네','아니요']);
        }
        else if (step.values.firstChoice.value === '생성')  {
            return await step.prompt(NUMBER_PROMPT,'몇일에 한번씩 하실건가요?(숫자만 입력)');
        }
        else if (step.values.firstChoice.value === '삭제')  {    
            return await step.prompt(CHOICE_PROMPT, `${step.result}방을 삭제합니다!`,['네','아니요']);
        }
        else{ //엿보기 결과 출력
            var res = database.queryShowAchievePercentage(step.result);
            const rows = res.rows;
            rows.map(row => {
                step.context.sendActivity(this.SeekRoomPercentage(row));
                console.log(this.SeekRoomPercentage(row));
            });
            endDialog = true;
            return await step.endDialog();
        }
         
    }

    async fourthStep(step) {
        console.log("fourthStep 진입!");
        step.values.thirdChoice = step.result;        
        
        if(step.values.firstChoice.value ==='참가'){
            if(step.values.thirdChoice.value ==='네'){
                var res = await database.queryRoomInfo(step.values.secondChoice);
                const rows = res.rows;
                var roomContext = rows[0].context;
                var roomCycle = rows[0].achievecycle;
                await database.queryJoinRoom(step.context._activity.from.name, step.values.secondChoice,roomContext,roomCycle);
                await step.context.sendActivity('참가되었습니다.');
            }
            else{
                await step.context.sendActivity('취소되었습니다.');
            }
            endDialog = true;
            return await step.endDialog();
        }

        else if(step.values.firstChoice.value ==='생성'){
            const msg = `목표 ${step.values.secondChoice} ${step.values.thirdChoice}일에 한번씩 하는 방을 추가합니다!`;
            return await step.prompt(CHOICE_PROMPT,msg,['네', '아니요']);
        }
        else{ //삭제
            if(step.values.thirdChoice.value ==='네'){
                database.queryDeleteAim(step.values.secondChoice.value);
                await step.context.sendActivity(`${step.values.secondChoice.value}방이 삭제되었습니다!`);
            }
            else{
                await step.context.sendActivity('취소되었습니다.');
            }
            endDialog = true;
            return await step.endDialog();
        }

    }
    
    async fifthStep(step) { //생성선택시에만 이 스탭으로 도달함
        console.log('fifthStep으로 진입!');
        if(step.result.value === `네`){
            var roomContext = step.values.secondChoice;
            var roomCycle = step.values.thirdChoice;
            var roomHead = step.context._activity.from.name;
            database.queryMakeRoom(roomContext, roomCycle, roomHead);
            await step.context.sendActivity('방 생성이 완료되었습니다.');
        }
        else{
            console.log("아니요로 진입");
            await step.context.sendActivity('취소되었습니다.');
        }
        endDialog = true;
        return await step.endDialog();
    }

    ShowRoomClear(row) {
        var msg = `room id : ${row.roomid} room 목표 : ${row.context} \r\n 목표 주기 : ${row.achievecycle}일에 한번`;
        return msg;
    }

    SeekRoomPercentage(row){
        var msg = `${row.userID}는 ${row.percentage}% 달성중.`;
        return msg;
    }
    
    async isDialogComplete() {
        console.log('몇번 돌아갈까요');
        return endDialog;
    }

    
}

module.exports.roomDialog = roomDialog;
module.exports.ROOM_DIALOG = ROOM_DIALOG;
