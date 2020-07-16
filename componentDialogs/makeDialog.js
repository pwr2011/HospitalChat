const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const { LuisRecognizer } = require('botbuilder-ai');
const { DB } = require('../DB');

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

const database = new DB();

class makeDialog extends ComponentDialog {

    constructor(conservsationState,userState) {
        super('makeDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));


        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this),  // Ask confirmation if user wants to make reservation?
            this.getContext.bind(this),    // Get name from user
            
            this.confirmStep.bind(this), // Show summary of values entered by user and ask confirmation to make reservation
            this.summaryStep.bind(this)

        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async run(turnContext, accessor) {
        console.log("dialog run 진입");

        /*const luisResult = await dispatchRecognizer.recognize(turnContext);
        console.log("luis pass!");
        
        const intent = LuisRecognizer.topIntent(luisResult);
        const entities = luisResult.entities;
        console.log(entities);*/


        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    // step.values.noOfParticipants = step._info.options.(Entiti이름)[0];
    async firstStep(step) {
        console.log('firstStep 진입');
        endDialog = false;
        // Running a prompt here means the next WaterfallStep will be run when the users response is received.
        return await step.prompt(CHOICE_PROMPT, 'AIMY가 뭘 도와드릴까요?', ['일정', '목표','스케줄확인']);

    }

    async getContext(step) {
        console.log('SecondStep 진입');
        step.values.choice = step.result;
        console.log(step.result)
        if (step.result.value === '일정') {
            return await step.prompt(CHOICE_PROMPT, '일정을 선택하셨어요. 그다음은요?',['추가','삭제','일정보기']);
        }
        else if(step.result.value ==='목표'){
            return await step.prompt(CHOICE_PROMPT,'목표를 선택하셨어요. 그다음은요?',['추가','삭제','목표보기']);
        }
        else {
            //스케줄 출력
            return '확인';
        }

    }

    async confirmStep(step) {
        console.log('confirmStep 진입');
        console.log(step.result);
        step.values.detail = step.result;
        
        //var msg = ` 확인 \n 선택: ${step.values.choice.value}\n detail: ${step.values.detail.value}\n`

        //await step.context.sendActivity(msg);

        return await step.prompt(TEXT_PROMPT, '몇시부터 몇시까지 무슨 일정?');
    }

    async summaryStep(step) {
        console.log("4th step in!");
        
        
        const luisResult = await dispatchRecognizer.recognize(step.context);
        console.log("luis pass!");
        const entities = luisResult.entities;
        console.log(entities);
        
        console.log(step.values.choice.value);
        console.log(step.values.detail.value);

        if(step.values.choice.value === '일정'){
            if(step.values.detail.value === '추가'){
                console.log("if-else -> 일정추가");
                database.queryInsertSchedule(entities);
            }
            else if(step.values.detail.value ==='삭제'){
                database.queryDeleteSchedule(entities);
            }
            else{ //수정
                
            }
        }
        else if(step.values.choice.value === '목표'){
            if(step.values.detail.value === '추가'){
                database.queryInsertAim(entities);
            }
            else if(step.values.detail.value ==='삭제'){
                database.queryDeleteAim(entities);
            }
            else{ //목표 수정
                
            }
        }
        else{ //스케줄 확인
            database.queryDatabase();
        }

        endDialog = true;
        return await step.endDialog();
    }

    async isDialogComplete() {
        return endDialog;
    }
}

module.exports.makeDialog = makeDialog;
