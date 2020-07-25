//직접 Aimy와 대화하는 기능을 위해 추가된 direct Dialog가 구현되어 있다.

//waterfall을 구현하기 위한 require들
const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const { ChoicePrompt, TextPrompt } = require('botbuilder-dialogs');

//Luis를 이용하기 위한 require
const { LuisRecognizer } = require('botbuilder-ai');

const { database } = require('../DBconnect');

//Dialog구현을 쉽게 하기 위한 변수들
const DIRECT_DIALOG = 'DIRECT_DIALOG';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

var endDialog = '';
var entities;
var intent;

//Luis 활용을 위한 변수 dispatchRecognizer
const dispatchRecognizer = new LuisRecognizer({
    applicationId: process.env.LuisAppId,
    endpointKey: process.env.LuisAPIKey,
    endpoint: `https://${process.env.LuisAPIHostName}.api.cognitive.microsoft.com`
}, {
    includeAllIntents: true

}, true);

//directDialog 구현
class directDialog extends ComponentDialog {
    constructor() {
        super(DIRECT_DIALOG);

        //사용할 prompt를 addDialog로 추가
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        //waterfall step을 정의한다.
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this),
            this.process.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    //목표 수정/삭제, 방 추가 기능들은 먼저 어떤 목표가 있는지
    //어떤 방이 있는지 확인해야 하므로 목표와 방들을 출력해준다.
    async firstStep(step) {

        step.context.sendActivity('현재 본인의 목표 목록입니다');

        //query를 위한 userName 저장, 모든 목표 보여준다.
        var userName = step.context._activity.from.name;
        var res0 = await database.queryShowAim(userName);
        const rows0 = res0.rows;
        rows0.map(row => {
            step.context.sendActivity(`Aim Id : ${row.aimid} context : ${row.context}`);
        });

        //모든 방 보여준다.
        step.context.sendActivity('현재 존재하는 공동목표 방 목록입니다');
        var res = await database.queryShowAllRoom();
        const rows = res.rows;
        rows.map(row => {
            step.context.sendActivity(`room Id : ${row.roomid} context : ${row.context}`);
        });

        endDialog = false;

        //입력받을 명령어를 자유롭게 입력받도록 한다.
        return await step.prompt(TEXT_PROMPT, "명령어를 입력해주세요");
    }

    async process(step) {

        //입력받은 명령어를 luis로 분석한다.
        const luisResult = await dispatchRecognizer.recognize(step.context);
        intent = LuisRecognizer.topIntent(luisResult);
        entities = luisResult.entities;

        //목표 추가인 경우
        if (intent === 'Add') {

            var userName = step.context._activity.from.name;
            await database.queryInsertAim(entities, userName, entities.context);
            step.context.sendActivity(`${entities.context} 목표가 추가되었습니다`);
            endDialog = true;
            return await step.endDialog();
        }

        //목표 삭제인 경우
        else if (intent === 'Delete') {

            //queryDeleteAim query를 실행한다.
            var userName = step.context._activity.from.name;
            await database.queryDeleteAim(entities.AimyTableNumber, userName);
            step.context.sendActivity(`${entities.AimyTableNumber}번 목표가 삭제되었습니다`);
            endDialog = true;
            return await step.endDialog();
        }

        //추후 구현
        else if (intent === 'Modify') {
            var userName = step.context._activity.from.name;

            endDialog = true;
            return await step.endDialog();
        }

        else if (intent === '방참가하기') {

            //queryRoomEnter query를 실행한다.
            var userName = step.context._activity.from.name;
            await database.queryRoomEnter(userName, entities.AimyTableNumber);
            step.context.sendActivity(`${entities.AimyTableNumber}번 방참가가 완료되었습니다!`);

            endDialog = true;
            return await step.endDialog();
        }

        //사용자가 Aimy의 목적을 묻는 경우이다.
        else if (intent === '목적') {
            step.context.sendActivity("AIMY는 사용자의 일정을 효율적으로 관리하기 위해서 만들어진 봇 입니다. 아직은 1살이라 부족한 면이 많으니 너그럽게 봐주세요.. ☆");
            endDialog = true;
            return await step.endDialog();
        }

        else {
            step.context.sendActivity('의도를 이해하지 못하였습니다.');
            endDialog = true;
            return await step.endDialog();
        }
    }

    async isEndDialog() {
        return endDialog;
    }
}

module.exports.directDialog = directDialog;
module.exports.DIRECT_DIALOG = DIRECT_DIALOG;