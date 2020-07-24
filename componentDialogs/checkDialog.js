// 목표를 달성했는지에 관한 기능들을 구현함
// 목표를 달성했다면 달성 카운트를 1 증가시켜주고 성취율 퍼센트를 갱신한다.

const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const { ChoicePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const { database } = require('../DBconnect');
const CHECK_DIALOG = 'CHECK_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';


var endDialog = '';
var makeDay = 1000 * 60 * 60 * 24; //일단위로 만들기위해 나눠줘야하는 정수
var cur_time = new Date();
var percentage; //달성률 저장변수
var roomNumber;

//checkDialog의 구현
class checkDialog extends ComponentDialog {
    constructor() {
        super(CHECK_DIALOG);

        //사용할 prompt를 addDialog로 등록해준다.
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));

        //waterfall Dialog의 step을 bind로 선언해준다.
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.selectStep.bind(this),
            this.processStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    // user의 목표들을 보여준 후, 완료한 목표를 선택하게 한다.
    async selectStep(step) {
        console.log("selectStep 진입");
        endDialog = false;

        //query 실행을 위한 userName을 저장한다.
        //목표 출력
        var userName = step.context._activity.from.name;
        var res = await database.queryShowAim(userName);
        const rows = res.rows;
        rows.map(row => {
            step.context.sendActivity(`${this.showAimClearAll(row)}`);
        });

        //number prompt로 완료한 목표의 번호를 입력받게 한다.
        return await step.prompt(NUMBER_PROMPT, '완료한 목표의 번호를 선택하세요')
    }


    async processStep(step) {
        console.log('processStep 진입');

        //roomNumber 함수에 전 step의 결과를 저장한다.
        roomNumber = step.result;

        // roomNumber번 방에 들어있는 모든 사람들의 달성률을 보여준다.
        var res = await database.queryGetPercentageGroup(roomNumber);
        const rows = res.rows;

        //query결과에서 curCount, deadline, achieveCycle
        //목표시작시간 정보들을 받아온다.
        var res_curCount = rows[0].achievecount;
        var res_deadline = rows[0].deadline;
        var res_cycle = rows[0].achievecycle;
        var res_starttimeday = rows[0].starttimeday;
        var res_starttimemonth = rows[0].starttimemonth;

        //배열형태로 deadline정보들을 받아온다.
        var deadlineArray = res_deadline.split("-");

        //읽어온 deadline정보를 Date()형태로 만들어준다.
        var deadObj = new Date();
        deadObj.setFullYear(parseInt(deadlineArray[0]), parseInt(Number(deadlineArray[1]) - 1), parseInt(deadlineArray[2]));

        //현재 날짜와 deadline 날짜를 비교하여 실제로 count가 되는지 확인한다.
        if (cur_time.getTime() > deadObj.getTime()) {

            //현재시간과 deadline의 시간차이를 계산한다.
            var betweenDay = parseInt((cur_time.getTime() - deadObj.getTime()) / makeDay);

            //Deadline의 시간을 현재시간 + achieveCycle만큼으로 하여 갱신한다.
            deadObj.setDate(deadObj.getDate() + res_cycle);
            await database.querySetDeadline(aimNumber, deadObj);
        }
        else {

            //현재시간과 deadline의 시간차이를 계산한다.
            var betweenDay = (deadObj.getTime() - cur_time.getTime()) / makeDay;
            
            // 성취율을 100%가 넘는것을 막기위한 if-else
            if (betweenDay < res_cycle) {

                //성취 카운트 +1 갱신
                await database.querySetAchieveCount(aimNumber, res_curCount + 1); 

                //deadline갱신
                deadObj.setDate(deadObj.getDate() + res_cycle);
                await database.querySetDeadline(aimNumber, deadObj);
            }
            else {
                
                //정해진 주기안에 1번 초과를 달성하려고 할때 들어오게 된다.
                await step.context.sendActivity('거짓말은 용인될 수 없습니다');
                return await step.endDialog();
                //아무것도 안함
            }

        }

        //성취율을 갱신하는 과정

        //목표 시작 시간
        var startTime = new Date();
        startTime.setFullYear(2020, res_starttimemonth - 1, res_starttimeday);

        //현재 시간과 목표 시작시간의 차이를 일수로 계산한다.
        var betweenDay = parseInt((cur_time.getTime() - startTime.getTime()) / makeDay);
        
        if (betweenDay == 0) {
            percentage = 100;
        }
        else {
            percentage = ((res_curCount + 1) / (betweenDay / res_cycle)) * 100;

        }

        //퍼센트를 갱신한다.
        await database.querySetPercentage(aimNumber, percentage);

        endDialog = true;
        return await step.endDialog();
    }

    //dialog가 끝났는지 확인하기 위한 함수
    async isDialogComplete() {
        return endDialog;
    }

    //목표를 깔끔하게 보여주기 위한 함수
    showAimClearAll(row) {
        var msg = `aim id : ${row.aimid} 목표 : ${row.context} \r\n 목표 주기 : ${row.achievecycle}일에 한번
        \r\n 시작일 : ${row.starttimemonth} 월 ${row.starttimeday}\r\n 종료일 :${row.endtimemonth} 월 ${row.endtimeday}\r\n
        현재달성률 :${row.percentage}%`;
        return msg;
    }
}

module.exports.checkDialog = checkDialog;
module.exports.CHECK_DIALOG = CHECK_DIALOG;


