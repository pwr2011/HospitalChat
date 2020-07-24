// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, DialogSet, DialogTurnStatus, WaterfallDialog } = require('botbuilder-dialogs');
const {aimDialog,AIM_DIALOG } = require('./aimDialog');
const { roomDialog,ROOM_DIALOG } = require('./roomDialog');
const { directDialog , DIRECT_DIALOG} = require('./directDialog');
const { checkDialog, CHECK_DIALOG} = require('./checkDialog');



const MAIN_DIALOG = 'MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

const { LuisRecognizer } = require('botbuilder-ai');
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


//db연결



class MainDialog extends ComponentDialog {
    constructor(userState) {
        super(MAIN_DIALOG);
        this.userState = userState;
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);


        this.addDialog(new ChoicePrompt(CHOICE_PROMPT)); // 박스


        this.addDialog(new aimDialog());
        this.addDialog(new roomDialog());
        this.addDialog(new directDialog());
        this.addDialog(new checkDialog());
        
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
        endDialog = false;
        console.log('choiceStep 진입');
        return await step.prompt(CHOICE_PROMPT, 'AIMY가 뭘 도와드릴까요?', ['ROOM', '목표', '스케줄확인','직접입력','목표완료']);

    }

    //함수명 변경 - 오현석
    async detailStep(step) {
        console.log('detailStep 진입');
        step.values.choice = step.result;

        if (step.result.value === '목표') {
            console.log('aimdialog 진입');
            return await step.beginDialog(AIM_DIALOG);

        }
        else if (step.result.value === 'ROOM') {
            console.log('roomdialog 진입');
            return await step.beginDialog(ROOM_DIALOG);
        }
        else if(step.result.value==='스케줄확인'){

            //스케줄 출력
            database.queryResultSchedule()
            return '확인';
        }

        else if(step.result.value==='직접입력')
        {
            return await step.beginDialog(DIRECT_DIALOG);


        }
        else if(step.result.value==='목표완료'){

            return await step.beginDialog(CHECK_DIALOG);
        }

    }


    async finalStep(step) {
        endDialog = true;
        return await step.endDialog();
    }

    async isEndDialog(){

        return endDialog;
    }
}

module.exports.MainDialog = MainDialog;
module.exports.MAIN_DIALOG = MAIN_DIALOG;