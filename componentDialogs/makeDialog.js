const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');


const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const DATETIME_PROMPT = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = '';

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
        endDialog = false;
        // Running a prompt here means the next WaterfallStep will be run when the users response is received.
        return await step.prompt(CHOICE_PROMPT, 'AIMY가 뭘 도와드릴까요?', ['일정', '목표','스케줄확인']);

    }

    async getContext(step) {
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

        step.values.detail = step.result

        var msg = ` 확인 \n 선택: ${step.values.choice.value}\n detail: ${step.values.detail.value}\n`

        await step.context.sendActivity(msg);

        return await step.prompt(CONFIRM_PROMPT, '입력한게맞지?', ['yes', 'no']);
    }

    async summaryStep(step) {

        if (step.result === true) {
            // Business 

            await step.context.sendActivity("일정 생성 완료!")
            endDialog = true;
            return await step.endDialog();

        }



    }
    async isDialogComplete() {
        return endDialog;
    }
}

module.exports.makeDialog = makeDialog;
