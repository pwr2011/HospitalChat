//목표방에 관련된 기능들을 구현한 파일이다.

const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const { ConfirmPrompt, ChoicePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const {database} = require('../DBconnect');

const ROOM_DIALOG='ROOM_DIALOG';

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = '';

class roomDialog extends ComponentDialog {

    constructor() {
        super(ROOM_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));


        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this), 
            this.secondStep.bind(this), 
            this.thirdStep.bind(this),  
            this.fourthStep.bind(this), 
            this.fifthStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    //메뉴를 선택하도록 한다.
    async firstStep(step) {
        endDialog = false;
        return await step.prompt(CHOICE_PROMPT, '방 메뉴에 들어왔어요! 어떤걸 원해요?', ['참가', '생성', '삭제', '엿보기']);
    }

    
    async secondStep(step) {
        step.values.firstChoice = step.result;
        var res = await database.queryShowAllRoom();
        const rows = res.rows;

        //방 참가일 경우
        if (step.values.firstChoice.value === '참가') {
      
            //모든 방을 보여준다.
            rows.map(row => {
                step.context.sendActivity(`${this.ShowRoomClear(row)}`);
            });
            return await step.prompt(NUMBER_PROMPT, '어떤방에 들어가시나요?');
        }
        
        //방 생성인 경우
        else if (step.values.firstChoice.value === '생성') {
            return await step.prompt(TEXT_PROMPT, '방의 목표를 입력해 주세요!');
        }

        //방 삭제인 경우
        else if (step.values.firstChoice.value === '삭제') {
         
            rows.map(row => {
                step.context.sendActivity(this.ShowRoomClear(row));
            });
            return await step.prompt(NUMBER_PROMPT, '몇번방을 삭제하실건가요?');
        }

        //엿보기란 같은 목표방에 있는 사람들의 달성률을 보여주는 기능이다.
        else {
            rows.map(row => {
                step.context.sendActivity(this.ShowRoomClear(row));
            });
            return await step.prompt(NUMBER_PROMPT, '몇번방을 엿보실건가요?');
        }

    }

    async thirdStep(step) {
        step.values.secondChoice = step.result;

        //방 참가일 경우
        if (step.values.firstChoice.value === '참가') {
            return await step.prompt(CHOICE_PROMPT, `${step.result}번방에 참가합니다!`,['네','아니요']);
        }

        //방 생성일 경우
        else if (step.values.firstChoice.value === '생성')  {
            return await step.prompt(NUMBER_PROMPT,'몇일에 한번씩 하실건가요?(숫자만 입력)');
        }
        
        //방 삭제일 경우
        else if (step.values.firstChoice.value === '삭제')  {    
            return await step.prompt(CHOICE_PROMPT, `${step.result}번방을 삭제합니다!`,['네','아니요']);
        }

        //엿보기 결과 출력
        else{
            var res = await database.queryShowAchievePercentage(step.result);
            const rows = res.rows;
            rows.map(row => {
                step.context.sendActivity(this.SeekRoomPercentage(row));
            });
            endDialog = true;
            return await step.endDialog();
        }
    }

    async fourthStep(step) {
        step.values.thirdChoice = step.result;        
        
        //방 참가일 경우
        if(step.values.firstChoice.value ==='참가'){
            if(step.values.thirdChoice.value ==='네'){
                
                //방 참가
                var res = await database.queryRoomInfo(step.values.secondChoice);
                const rows = res.rows;
                var roomContext = rows[0].context;
                var roomCycle = rows[0].achievecycle;
                await database.queryJoinRoom(step.context._activity.from.name, step.values.secondChoice,roomContext,roomCycle);
                await step.context.sendActivity('참가되었습니다.');
            }

            //취소
            else{
                await step.context.sendActivity('취소되었습니다.');
            }
            endDialog = true;
            return await step.endDialog();
        }

        //방 생성일 경우
        else if(step.values.firstChoice.value ==='생성'){
            const msg = `목표 ${step.values.secondChoice} ${step.values.thirdChoice}일에 한번씩 하는 방을 추가합니다!`;
            return await step.prompt(CHOICE_PROMPT,msg,['네', '아니요']);
        }

        //방 삭제일 경우
        else{ 
            if(step.values.thirdChoice.value ==='네'){
                database.queryDeleteRoom(step.values.secondChoice);
                await step.context.sendActivity(`${step.values.secondChoice}번방이 삭제되었습니다!`);
            }
            else{
                await step.context.sendActivity('취소되었습니다.');
            }
            endDialog = true;
            return await step.endDialog();
        }
    }

    //생성선택시에만 이 스탭으로 도달함    
    async fifthStep(step) { 
        if(step.result.value === `네`){

            //방을 생성하는 query를 실행한다.
            var roomContext = step.values.secondChoice;
            var roomCycle = step.values.thirdChoice;
            var roomHead = step.context._activity.from.name;
            database.queryMakeRoom(roomContext, roomCycle, roomHead);
            await step.context.sendActivity('방 생성이 완료되었습니다.');
        }
        else{
            await step.context.sendActivity('취소되었습니다.');
        }
        endDialog = true;
        return await step.endDialog();
    }

    //방 정보를 깨끗하게 보여주기 위한 함수
    ShowRoomClear(row) {
        var msg = `room id : ${row.roomid} room 목표 : ${row.context} \r\n 목표 주기 : ${row.achievecycle}일에 한번`;
        return msg;
    }

    //엿보기 기능을 위한 함수
    SeekRoomPercentage(row){
        var msg = `${row.userid}는 ${row.percentage}% 달성중.`;
        return msg;
    }
    
    async isDialogComplete() {
        return endDialog;
    }

    
}

module.exports.roomDialog = roomDialog;
module.exports.ROOM_DIALOG = ROOM_DIALOG;
