const {WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const {ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt  } = require('botbuilder-dialogs');

const {DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');


const CHOICE_PROMPT    = 'CHOICE_PROMPT';
const CONFIRM_PROMPT   = 'CONFIRM_PROMPT';
const TEXT_PROMPT      = 'TEXT_PROMPT';
const NUMBER_PROMPT    = 'NUMBER_PROMPT';
const DATETIME_PROMPT  = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog ='';

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
    this.getStartTime.bind(this),  // Number of participants for reservation
    this.getEndTime.bind(this), // Date of reservation
    this.getWakeUp.bind(this),  // Time of reservation
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

async firstStep(step) {
endDialog = false;
// Running a prompt here means the next WaterfallStep will be run when the users response is received.
return await step.prompt(CONFIRM_PROMPT, '일정을 만들면 AIMY가 일정을 관리해 드립니다! 일정 만드시겠어요?', ['yes', 'no']);
      
}

async getContext(step){
     
    console.log(step.result)
    if(step.result === true)
    { 
        return await step.prompt(TEXT_PROMPT, '일정을 입력해주세요.');
    }

}

async getStartTime(step){
     
    step.values.Context = step.result
    return await step.prompt(NUMBER_PROMPT, '일정의 시작시간을 입력해주세요!');
}

async getEndTime(step){

    step.values.StartTime = step.result

    return await step.prompt(DATETIME_PROMPT, '일정의 끝나는 시간을 입력해주세요!')
}

async getWakeUp(step){
    step.values.EndTime = step.result

    return await step.prompt(DATETIME_PROMPT, '몇분전에 알려드릴까요?')
}


async confirmStep(step){

    step.values.WakeUp = step.result

    var msg = ` You have entered following values: \n 일정 이름: ${step.values.Context}\n 시작 시간: ${step.values.StartTime}\n 끝나는 시간: ${JSON.stringify(step.values.EndTime)}\n 몇분전에 알려드릴까요?: ${JSON.stringify(step.values.WakeUp)}`

    await step.context.sendActivity(msg);

    return await step.prompt(CONFIRM_PROMPT, 'Are you sure that all values are correct and you want to make the reservation?', ['yes', 'no']);
}

async summaryStep(step){

    if(step.result===true)
    {
      // Business 

      await step.context.sendActivity("Reservation successfully made. Your reservation id is : 12345678")
      endDialog = true;
      return await step.endDialog();   
    
    }


   
}


async noOfParticipantsValidator(promptContext) {
    // This condition is our validation rule. You can also change the value at this point.
    return promptContext.recognized.succeeded && promptContext.recognized.value > 1 && promptContext.recognized.value < 150;
}

async isDialogComplete(){
    return endDialog;
}
}

module.exports.makeDialog = makeDialog;








