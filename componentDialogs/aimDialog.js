const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const { LuisRecognizer } = require('botbuilder-ai');

const AIM_DIALOG='AIM_DIALOG';

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
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
//db연결

class aimDialog extends ComponentDialog {

    constructor() {
        super(AIM_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
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

    async detailStep(step){
        console.log('Aim detailStpe 진입');
        step.values.choice = step.result;

        if(step.result.value ==='추가'){
            return await step.prompt(TEXT_PROMPT,'어떤 목표를 추가할까요?');

        }
        if(step.result.value ==='삭제'){

            //목표 리스트 보여주는 함수 위치
            return await step.prompt(TEXT_PROMPT,'삭제할 목표의 번호를 입력해주세요');


        }
        if(stpe.result.value === '수정'){
            //목표 리스트 보여주는 함수 위치
            return await step.prompt(TEXT_PROMPT,'수정할 목표의 번호를 입력해주세요');

        }

    }

    async typingStep(step){

        if(step.values.choice ==='추가'){
            context = step.result; //목표 내용이 저장됨
            return await step.prompt(TEXT_PROMPT,'목표 기간과 주기를 지정해주세요 예: 0월 0일 부터 0일 0일까지 0일마다');
        }
        else if(step.values.choice ==='삭제'){
            aimNumber = step.result //삭제 리스트 번호가 저장됨
            return await step.continueDialog();
            
        }

        else if(step.values.choice ==='수정'){
            aimNumber = step.result //수정 리스트 번호가 저장됨
            return await step.prompt(CHOICE_PROMPT,'목표의 어느 부분을 수정하시겠어요?',['목표내용','기간','수행주기']);

        }


    }

    async secondChoice(step){

        if(step.values.choice.value ==='추가')
        {
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
            //어떤 부분을 수정할지에 대한 정보를 저장함
            if(step.result.value ==='목표내용'){

                step.values.modifyWhat = step.result;
                return await step.prompt(TEXT_PROMPT,'목표를 뭘로 수정할까요?');
            }
            else if(step.result.value ==='기간'){

                step.values.modifyWhat = step.result;
                return await step.prompt(TEXT_PROMPT,'기간을 어떻게 수정할까요?');

            }
            else if(step.result.value ==='수행주기'){

                step.values.modifyWhat = step.result;
                return await step.prompt(TEXT_PROMPT,'수행주기를 어떻게 수정할까요?');


            }

        }

    }

    async summaryStep(step){


        if(step.values.choice.value ==='추가')
        {

            return await step.prompt(CHOICE_PROMPT,`목표: ${context} \n 기간 :${entities.startTime_month}월 ${entities.startTime_day}일 부터 ${entities.endTime_month}월 ${entities.endTime_day}일 까지 \n 주기: ${entities.timeCycle} 맞습니까?`,['네','아니오']);
            

        }
        //삭제 이면
      else if(step.values.choice.value  ==='삭제')
        {
            return await step.prompt(CHOICE_PROMPT,`${aimNumber}번 목표 삭제할까요?`,['네','아니오']);
           
        }

       else if(step.values.choice.value ==='수정')
        {
            modifycontent = step.result.value;
            return await step.prompt(CHOICE_PROMPT,`${step.values.modifyWhat.value}을 ${modifycontent}로 바꾸는 것이 맞습니까?`,['네','아니오']);

            
        }


    }

    async processStep(stpe){


        if(step.values.choice.value ==='추가')
        {
            if(step.result.value ==='네'){
                console.log('목표 추가하는 디비함수');
                //추가하는 디비함수
                //디비함수의 파라미터는 entities. 으로 보냄

                endDialog = true;
                return await step.endDialog();//dialog 종료

            }
            if(step.result.value ==='아니오'){

                await step.context.sendActivity('목표 추가를 취소하셨습니다.');

                endDialog = true;
                return await step.endDialog();//dialog 종료
            }

        }

        else if(step.values.choice.value ==='삭제')
        {
            if(step.result.value ==='네'){

                console.log("삭제, 네 진입");
                //await queryDeleteAim(aimNumber);//삭제 디비함수
                endDialog = true;
                return await step.endDialog();//dialog 종료
            }
            if(step.result.value ==='아니오'){
                endDialog = true;
                return await step.endDialog();//dialog 종료
            }
        }

        else if(step.values.choice.value==='수정')
        {
            
            if(step.result.value==='네'){
                
                //수정 디비 함수위치할곳

            }
           else if(step.result.value==='아니오'){

                await step.context.sendActivity('목표 수정을 취소하셨습니다.');
                endDialog = true;
                return await step.endDialog();//dialog 종료
            }



        }



    }




    async isDialogComplete() {
        return endDialog;
    }

}

module.exports.aimDialog = aimDialog;
module.exports.AIM_DIALOG = AIM_DIALOG;

