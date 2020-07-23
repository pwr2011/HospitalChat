const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const { LuisRecognizer } = require('botbuilder-ai');

const {database} = require('../DBconnect');

const DIRECT_DIALOG='DIRECT_DIALOG';


const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const DATETIME_PROMPT = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = '';
var entities;

const dispatchRecognizer = new LuisRecognizer({
    applicationId: process.env.LuisAppId,
    endpointKey: process.env.LuisAPIKey,
    endpoint: `https://${process.env.LuisAPIHostName}.api.cognitive.microsoft.com`
}, {
    includeAllIntents: true
  
}, true);

class directDialog extends ComponentDialog{
    constructor(){
        super(DIRECT_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WATERFALL_DIALOG(WATERFALL_DIALOG,[



        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

   async firstStep(step){
        endDialog = false;
        return await step.prompt(TEXT_PROMPT,"명령어를 입력해주세요");


    }

    async process(step){
        const luisResult = await dispatchRecognizer.recognize(step.context);
        console.log("luis pass In directDialog.js");
        const intent =  LuisRecognizer.topIntent(luisResult);
        console.log(intent);//intent 확인되었나
        entities = luisResult.entities;

        if(intent ==='Add'){

            
            endDialog = true;
            return await step.endDialog();

        }

        else if(intent ==='Delete'){

            database.queryShowAim();

            endDialog = true;
            return await step.endDialog();

        }

        else if(intent ==='Modify'){

            endDialog = true;
            return await step.endDialog();
        }

        else if(intent ==='목표보여주기')
        {

            endDialog = true;
            return await step.endDialog();
        }

        else if(intent ==='방나가기'){


            endDialog = true;
            return await step.endDialog();
        }

        else if(intent ==='방보여주기'){

            endDialog = true;
            return await step.endDialog();
        }
        else if(intent ==='방참가하기'){


            
        }
        else{

            step.context.sendActivity('의도를 이해하지 못하였습니다.');
            endDialog = true;
            return await step.endDialog();


        }


    }

    async isEndDialog()
    {
        return endDialog;

    }

}

module.exports.directDialog = directDialog;
module.exports.DIRECT_DIALOG = DIRECT_DIALOG;