//main dialog가 구현되어 있는 파일이다.

const { ComponentDialog, DialogSet, DialogTurnStatus, WaterfallDialog } = require('botbuilder-dialogs');
const { aimDialog, AIM_DIALOG } = require('./aimDialog');
const { roomDialog, ROOM_DIALOG } = require('./roomDialog');
const { directDialog, DIRECT_DIALOG } = require('./directDialog');
const { checkDialog, CHECK_DIALOG } = require('./checkDialog');

const { database } = require('../DBconnect');
const MAIN_DIALOG = 'MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

const { ChoicePrompt } = require('botbuilder-dialogs');

const CHOICE_PROMPT = 'CHOICE_PROMPT';

var endDialog = '';

//main Dialog 구현
class MainDialog extends ComponentDialog {
    constructor(userState) {
        super(MAIN_DIALOG);
        this.userState = userState;
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

        //사용할 prompt를 addDialog로 추가해준다.
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new aimDialog());
        this.addDialog(new roomDialog());
        this.addDialog(new directDialog());
        this.addDialog(new checkDialog());

        //waterfall의 순서를 정의한다.
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.choiceStep.bind(this),
            this.detailStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**.
     * @param {*} turnContext
     * @param {*} accessor
     */

     //run()함수는 dialog의 핵심 함수로써 dialog step의 실행을 관리한다.
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    //기능들을 선택하도록 하는 dialog
    async choiceStep(step) {
        endDialog = false;
        
        return await step.prompt(CHOICE_PROMPT, 'AIMY가 뭘 도와드릴까요?', ['ROOM', '목표', '나의 목표 확인', '직접입력', '목표완료']);
    }

    //선택한 기능에 따라 sub dialog를 실행시켜 주는 함수이다.
    async detailStep(step) {

        //이전 step의 값 저장한다.
        step.values.choice = step.result;
        if (step.result.value === '목표') {
            return await step.beginDialog(AIM_DIALOG);
        }
        else if (step.result.value === 'ROOM') {
            return await step.beginDialog(ROOM_DIALOG);
        }

        else if (step.result.value === '나의 목표 확인') {
            
            //스케줄 확인은 바로 query를 실행해 보여준다.
            var userName = step.context._activity.from.name;
            var res = await database.queryShowAim(userName);
            const rows = res.rows;
            rows.map(row => {
                step.context.sendActivity(`${this.showAimClearAll(row)}`);
            });

            return step.continueDialog();
        }

        //직접 명령어 입력 dialog 실행
        else if (step.result.value === '직접입력') {
            return await step.beginDialog(DIRECT_DIALOG);
        }

        else if (step.result.value === '목표완료') {
            return await step.beginDialog(CHECK_DIALOG);
        }

    }


    async finalStep(step) {
        endDialog = true;
        return await step.endDialog();
    }

    async isEndDialog() {

        return endDialog;
    }

    //목표를 보여주기 위한 함수이다.
    showAimClearAll(row) {
        var msg = `aim id : ${row.aimid} 목표 : ${row.context} \r\n 목표 주기 : ${row.achievecycle}일에 한번
        \r\n 시작일 : ${row.starttimemonth} 월 ${row.starttimeday}\r\n 종료일 :${row.endtimemonth} 월 ${row.endtimeday} \r\n
        목표달성률: ${row.percentage}%`;
        return msg;
    }
}

module.exports.MainDialog = MainDialog;
module.exports.MAIN_DIALOG = MAIN_DIALOG;