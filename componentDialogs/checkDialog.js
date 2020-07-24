
const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const { LuisRecognizer } = require('botbuilder-ai');

const {database} = require('../DBconnect');
const CHECK_DIALOG = 'CHECK_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

var endDialog = '';
var makeDay = 1000*60*60*24; //일단위로 만들기위해 나눠줘야하는 정수
var cur_time = new Date();
var percentage; //달성률 저장변수
var aimNumber;
class checkDialog extends ComponentDialog {
    constructor(){
        super(CHECK_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
           
            this.selectStep.bind(this),
            this.processStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }
    
    async selectStep(step){
        
        endDialog =false;
        var userName = step.context._activity.from.name;
        var res = await database.queryShowAim(userName);
        const rows = res.rows;
        rows.map(row => {
            step.context.sendActivity(`${this.showAimClearAll(row)}`);

            console.log(this.showAimClearAll(row));
        });

        return await step.prompt(NUMBER_PROMPT,'완료한 목표의 번호를 선택하세요')

     

    }

    async processStep(step){
        console.log('processStep...');
      
        aimNumber = step.result;
       
        var res = await database.queryGetPercentageGroup(aimNumber);

        const rows = res.rows;
        var res_curCount=(rows[0].achievecount);
        console.log('curCount:')
        console.log(res_curCount);
        var res_deadline = (rows[0].deadline);
        console.log(res_deadline);
       

        console.log('\r\ndeadline:')
        console.log(res_deadline);
        var res_cycle = rows[0].achievecycle;
        

        
        console.log('\r\ncycle:')
        console.log(res_cycle);
        var res_starttimeday = rows[0].starttimeday; //목표 시작 일
        var res_starttimemonth = rows[0].starttimemonth;//목표시작 월

        var deadlineArray = res_deadline.split("-");
        console.log(parseInt(deadlineArray[0]));
        console.log(parseInt(Number(deadlineArray[1])-1));
        console.log(parseInt(deadlineArray[2]));

        var deadObj = new Date();
        deadObj.setFullYear(parseInt(deadlineArray[0]),parseInt(Number(deadlineArray[1])-1),parseInt(deadlineArray[2]));
        console.log(deadObj);


        //자료형이 다르기때문에 실제로 시간 비교가 되는지 확인 필요
        //여기서 마이너스는 일자의 차이가 나와야함.
        if(cur_time.getTime()>deadObj.getTime()){
            console.log('첫번째 if')
            var betweenDay = parseInt((cur_time.getTime()-deadObj.getTime())/makeDay);

           
            console.log(parseInt(Math.ceil(betweenDay/res_cycle) * res_cycle,10));
            deadObj.setDate(deadObj.getDate() +res_cycle);

            console.log('마지막 deadObj');
            console.log(deadObj);
            await database.querySetDeadline(aimNumber,deadObj);
            console.log('setDeadline 완료');
        }
        else{
            console.log('else 안에서 deadObj');
            console.log(deadObj);
            var betweenDay = (deadObj.getTime() - cur_time.getTime())/makeDay;
            console.log(betweenDay);
            if(betweenDay < res_cycle){ //일자로 따져야함
                console.log('else->if')
                await database.querySetAchieveCount(aimNumber,res_curCount+1); //카운트 증가
                deadObj.setDate(deadObj.getDate()+res_cycle);

                await database.querySetDeadline(aimNumber,deadObj);//deadline갱신
            }
            else{

                await step.context.sendActivity('거짓말은 용인될 수 없습니다');
                return await step.endDialog();
                //아무것도 안함
            }
            
        }

        //퍼센트 계산후 갱신
        //목표 시작 시간
        var startTime = new Date();
        startTime.setFullYear(2020,res_starttimemonth-1,res_starttimeday);
      

        var betweenDay =parseInt((cur_time.getTime()-startTime.getTime())/makeDay);
        console.log('betweenDay:');
        console.log(betweenDay);

        if(betweenDay == 0){
            percentage = 100;
        }
        else{
            percentage = ((res_curCount+1)/(betweenDay/res_cycle)) * 100;

        }
        console.log(res_cycle);
        console.log(res_curCount);
        console.log(res_curCount+1);
      
        
        
        console.log(percentage);

        await database.querySetPercentage(aimNumber,percentage);
        console.log('퍼센테이지 셋 완료 ');

        endDialog = true;
        return await step.endDialog();
    }

    async isDialogComplete() {
        return endDialog;
    }



    showAimClearAll(row){
        var msg = `aim id : ${row.aimid} 목표 : ${row.context} \r\n 목표 주기 : ${row.achievecycle}일에 한번
        \r\n 시작일 : ${row.starttimemonth} 월 ${row.starttimeday}\r\n 종료일 :${row.endtimemonth} 월 ${row.endtimeday}\r\n
        현재달성률 :${row.percentage}%` ;
        return msg;
    }
}

module.exports.checkDialog = checkDialog;
module.exports.CHECK_DIALOG = CHECK_DIALOG;


