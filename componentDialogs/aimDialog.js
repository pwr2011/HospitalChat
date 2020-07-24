const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const { LuisRecognizer } = require('botbuilder-ai');


const {database} = require('../DBconnect');

const AIM_DIALOG='AIM_DIALOG';

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

const DATETIME_PROMPT = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = '';

const dispatchRecognizer = new LuisRecognizer({
    applicationId: process.env.LuisAppId,
    endpointKey: process.env.LuisAPIKey,
    endpoint: `https://${process.env.LuisAPIHostName}.api.cognitive.microsoft.com`
}, {
    includeAllIntents: true
  
}, true);

var entities; //루이스 엔티티
var context; //목표내용
var modifycontent;//수정할내용
var aimNumber = -1 //목표 번호를 저장함 디폴트는 -1
var luisResult;




class aimDialog extends ComponentDialog {

    constructor() {
        super(AIM_DIALOG);
        

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));


        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.choiceStep.bind(this), //목표에 대해 추가 ,삭제, 수정 중 하나 선택
            this.detailStep.bind(this),  // 각각에 대한 이름
            this.typingStep.bind(this),  // 내용 타이핑 
            this.secondChoice.bind(this), //주기 타이핑
            this.summaryStep.bind(this), //요약
            this.processStep.bind(this) //DB처리 부분

        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async choiceStep(step){
        console.log('Aim choiceStpe 진입');
        endDialog = false;
        return await step.prompt(CHOICE_PROMPT,'명령을 선택해주세요',['추가','삭제','수정']);

    }

    async detailStep(step){//목표에 대한 추가 삭제 수정에 따라 필요한 값들을 받는 step
        console.log('detailStpe 진입');
        step.values.choice = step.result;

        if(step.result.value ==='추가'){
            console.log('추가 중');
            return await step.prompt(TEXT_PROMPT,'어떤 목표를 추가할까요?');

        }
        if(step.result.value ==='삭제'){
            //목표 리스트 보여주는 함수
            console.log('삭제 중');
            var userName = step.context._activity.from.name; //유저의 고유 아이디를 가져옴
            var res = await database.queryShowAim(userName); //유저의 고유 아이디를 이용하여 유저의 목표 목록을 보여줌
            const rows = res.rows;
            rows.map(row => {
                step.context.sendActivity(`${this.showAimClearAll(row)}`);

                console.log(this.showAimClearAll(row));
            });
            return await step.prompt(TEXT_PROMPT,'삭제할 목표의 번호를 입력해주세요');
        }
        if(step.result.value === '수정'){
            //목표 리스트 보여주는 함수 위치
            console.log('수정 중');
            var userName = step.context._activity.from.name;
            var res = await database.queryShowAim(userName);
            const rows = res.rows;
            rows.map(row => {
                step.context.sendActivity(`${this.showAimClearAll(row)}`);
                console.log(this.showAimClearAll(row));
            });
            return await step.prompt(TEXT_PROMPT,'수정할 목표의 번호를 입력해주세요');

        }

    }

    async typingStep(step){//추가인 경우 사용자가 직접 텍스트를 입력하여 목표기간을 입력하고, 수정인 경우 수정할 부분을 선택하도록 하는 step
        console.log("typingStep 진입!");
        if(step.values.choice.value ==='추가'){
            context = step.result; //목표 내용이 저장됨
            return await step.prompt(TEXT_PROMPT,'목표 기간과 주기를 지정해주세요 예: 0월 0일 부터 0일 0일까지 0일마다');
        }
        else if(step.values.choice.value ==='삭제'){
            aimNumber = step.result //삭제 리스트 번호가 저장됨
            return await step.continueDialog();
            
        }

        else if(step.values.choice.value ==='수정'){
            aimNumber = step.result //수정 리스트 번호가 저장됨
            return await step.prompt(CHOICE_PROMPT,'목표의 어느 부분을 수정하시겠어요?',['목표내용','기간','수행주기']);

        }


    }

    async secondChoice(step){//추가하는 경우 루이스와 연동하여 텍스트를 분석하고 DB에 목표를 추가하게 함

        if(step.values.choice.value ==='추가')
        {   console.log('텍스트 루이스를 이용해 분석');

            const luisResult = await dispatchRecognizer.recognize(step.context);
            console.log("luis pass!");
            const intent =  LuisRecognizer.topIntent(luisResult);
            console.log(intent);//intent 확인되었나
            entities = luisResult.entities;
            if(intent==='Add')
            {   
            
                console.log('루이스 정상...');
             
               return await step.continueDialog();
                

            }
            else if(intent ==='None'){
                console.log('해당 intent 존재 하지 않음!');
                await step.context.sendActivity('유효하지 않은 기간 설정입니다.');
                endDialog = true;
                return await step.endDialog();
            }

        }
    
        //삭제이면
        else if(step.values.choice.value  ==='삭제')
        {
            return await step.continueDialog();
        
        }

    
       else if(step.values.choice.value ==='수정')
        {
           
            if(step.result.value ==='목표내용'){
                 //어떤 부분을 수정할지는 modifyWhat 에 저장함
                console.log('수정->목표내용');

                step.values.modifyWhat = step.result;
                return await step.prompt(TEXT_PROMPT,'목표를 뭘로 수정할까요?');
            }
            else if(step.result.value ==='기간'){
                console.log('수정->기간');
                step.values.modifyWhat = step.result;
                return await step.prompt(TEXT_PROMPT,'기간을 어떻게 수정할까요?');

            }
            else if(step.result.value ==='수행주기'){
                console.log('수정->수행주기');
                step.values.modifyWhat = step.result;
                return await step.prompt(NUMBER_PROMPT,'수행주기를 몇일로 수정할까요?');


            }

        }

    }

    async summaryStep(step){//지금까지의 과정을 요약하여 확인을 받는 step


        if(step.values.choice.value ==='추가')
        {

            return await step.prompt(CHOICE_PROMPT,`목표: ${context}  \r\n 기간 :${entities.startTime_month}월 ${entities.startTime_day}일 부터 ${entities.endTime_month}월 ${entities.endTime_day}일 까지 \r\n 주기: ${entities.timeCycle} \r\n 맞습니까?`,['네','아니오']);
            

        }
        //삭제 이면
      else if(step.values.choice.value  ==='삭제')
        {
            return await step.prompt(CHOICE_PROMPT,`${aimNumber}번 목표 삭제할까요?`,['네','아니오']);
           
        }

       else if(step.values.choice.value ==='수정')
        {
            modifycontent = step.result;
            luisResult = await dispatchRecognizer.recognize(step.context);
            console.log("luis pass!");
            const intent =  LuisRecognizer.topIntent(luisResult);
            console.log(intent);//intent 확인되었나
            entities = luisResult.entities; 
            return await step.prompt(CHOICE_PROMPT,`${step.values.modifyWhat.value}을 ${step.result}로 바꾸는 것이 맞습니까?`,['네','아니오']);

            
        }


    }

    async processStep(step){//postgresDB와 연동하여 자료를 저장하는 step


        if(step.values.choice.value ==='추가')
        {
            if(step.result.value ==='네'){ //목표 추가
                console.log('목표 추가하는 디비함수');
                var userName = step.context._activity.from.name;
                console.log(entities);
                await database.queryInsertAim(entities,userName,context);
                console.log("추가완료!!!");

                endDialog = true;
                return await step.endDialog();//dialog 종료

            }
            if(step.result.value ==='아니오'){//목표 추가 취소

                await step.context.sendActivity('목표 추가를 취소하셨습니다.');

                endDialog = true;
                return await step.endDialog();//dialog 종료
            }

        }

        else if(step.values.choice.value ==='삭제')
        {
            if(step.result.value ==='네'){

                console.log("삭제, 네 진입"); //삭제 
                var userName = step.context._activity.from.name;
                //await database.queryIsInRoom(aimNumber,userName);
                await database.queryDeleteAim(aimNumber,userName);//삭제 디비함수


                endDialog = true;
                return await step.endDialog();//dialog 종료
            }
            if(step.result.value ==='아니오'){ //삭제 취소
                endDialog = true;
                return await step.endDialog();//dialog 종료
            }
        }

        else if(step.values.choice.value==='수정')
        {
            
            if(step.result.value==='네'){
                
                
                if(step.values.modifyWhat.value==='목표내용'){ //목표를 수정
                    console.log("목표 내용 수정 진입");
                    
                    await database.queryModifyAimContext(aimNumber,modifycontent);//수정 디비함수
                    endDialog = true;
                    return await step.endDialog();//dialog 종료

                }
                else if(step.values.modifyWhat.value ==='기간'){//목표 기간 수정
                
                    await database.queryModifyAimTime(aimNumber,entities);
                    console.log('수정완료');
                    endDialog = true;
                    return await step.endDialog();
                }
                else if(step.values.modifyWhat.value ==='수행주기'){ //목표 수행주기 수정
                        //수행주기를 파라미터로 넘김
                        
                        await database.queryModifyAimAchievecycle(aimNumber,modifycontent.value);
                        console.log('수정완료');
                        return await step.endDialog();
                }
            

            }
           else if(step.result.value==='아니오'){ //수정 취소

                await step.context.sendActivity('목표 수정을 취소하셨습니다.');
                endDialog = true;
                return await step.endDialog();//dialog 종료
            }



        }



    }

   
    //목표 목록을 보여줄때 사용되는 함수
    showAimClearAll(row){
        var msg = `aim id : ${row.aimid} 목표 : ${row.context} \r\n 목표 주기 : ${row.achievecycle}일에 한번
        \r\n 시작일 : ${row.starttimemonth} 월 ${row.starttimeday}\r\n 종료일 :${row.endtimemonth} 월 ${row.endtimeday}`;
        return msg;
    }
    //waterfalldiaglog가 끝났는지 확인하는 함수
    async isDialogComplete() {
        return endDialog;
    }

}

module.exports.aimDialog = aimDialog;
module.exports.AIM_DIALOG = AIM_DIALOG;

