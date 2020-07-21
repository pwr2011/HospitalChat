// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, DialogSet, DialogTurnStatus, WaterfallDialog } = require('botbuilder-dialogs');
//const { ROOMDIALOG, ROOM_DIALOG } = require('./roomDialog');

const MAIN_DIALOG = 'MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

const { LuisRecognizer } = require('botbuilder-ai');
const { DB } = require('../DB');

const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');


const CHOICE_PROMPT = 'CHOICE_PROMPT';

var endDialog = '';

const dispatchRecognizer = new LuisRecognizer({
    applicationId: process.env.LuisAppId,
    endpointKey: process.env.LuisAPIKey,
    endpoint: `https://${process.env.LuisAPIHostName}.api.cognitive.microsoft.com`
}, {
    includeAllIntents: true
}, true);

//루이스 엔티티 전역변수 
var entities;
var userName;
//db연결
const database = new DB();



class MainDialog extends ComponentDialog {
    constructor(userState) {
        super(MAIN_DIALOG);
        this.userState = userState;
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);


        this.addDialog(new ChoicePrompt(CHOICE_PROMPT)); // 박스


       // this.addDialog(new ROOMDIALOG());
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [

        this.choiceStep.bind(this),
        this.detailStep.bind(this),
        this.finalStep.bind(this)
        ]));
        
        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */


    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async choiceStep(step) {
        console.log('choiceStep 진입');
        return await step.prompt(CHOICE_PROMPT, 'AIMY가 뭘 도와드릴까요?', ['일정', '목표', '스케줄확인']);

    }

    //함수명 변경 - 오현석
    async detailStep(step) {
        console.log('detailStep 진입');
        step.values.choice = step.result;

        if (step.result.value === '일정') {
            return await step.prompt(CHOICE_PROMPT, '일정을 선택하셨어요. 그다음은요?', ['추가', '삭제', '수정']);
        }
        else if (step.result.value === '목표') {
            return await step.prompt(CHOICE_PROMPT, '목표를 선택하셨어요. 그다음은요?', ['추가', '삭제', '수정']);
        }
        else {

            //스케줄 출력
            database.queryResultSchedule()
            return '확인';
        }

    }


    async finalStep(step) {

        return await step.endDialog();
    }
}

module.exports.MainDialog = MainDialog;
module.exports.MAIN_DIALOG = MAIN_DIALOG;