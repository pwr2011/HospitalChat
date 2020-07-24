
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
var makeDay = 1000/60/60/24; //일단위로 만들기위해 나눠줘야하는 정수
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
        console.log('\r\ndeadline:')
        console.log(res_deadline);
        var res_cycle = rows[0].achievecycle; 
        console.log('\r\ncycle:')
        console.log(res_cycle);
        var res_starttimeday = rows[0].starttimeday; //목표 시작시간
        var res_starttimemonth = rows[0].starttimemonth[0];
        
        var deadlineArray = res_deadline.split("-");
        var deadObj = new Date(deadlineArray[0],Number(deadlineArray[1])-1,deadlineArray[2]);


        //자료형이 다르기때문에 실제로 시간 비교가 되는지 확인 필요
        //여기서 마이너스는 일자의 차이가 나와야함.
        if(cur_time.getTime()>deadObj.getTime()){
            var betweenDay = (cur_time.getTime()-deadObj.getTime())/makeDay;

            var new_deadline = Math.ceil(betweenDay/res_cycle) * res_cycle + res_deadline;
            await database.querySetDeadline(new_deadline);
        }
        else{
            var betweenDay = (deadObj.getTime() - cur_time.getTime())/makeDay;

            if(betweenDay < res_cycle){ //일자로 따져야함
                
                await database.querySetAchiveCount(aimNumber,res_curCount+1); //카운트 증가
                dateObj.setDate(deadObj.getDate()+res_cycle);

                await database.querySetDeadline(aimNumber,deadObj);//deadline갱신
            }
            else{
                //아무것도 안함
            }
            
        }

        //퍼센트 계산후 갱신
        var betweenDay =(cur_time.getTime()-res_starttime.getTime())/makeDay;
        percentage = ((res_curCount+1)/(betweenDay/res_cycle)) * 100;
        await database.querySetPercentage(aimNumber,percentage);
        

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


