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
var intent;
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
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG,[



        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

   async firstStep(step){
        step.context.sendActivity('현재 본인의 목표 목록입니다');
        await database.queryShowAim();

        step.context.sendActivity('현재 존재하는 공동목표 방 목록입니다');
        await database.queryShowAllRoom();

        endDialog = false;
        return await step.prompt(TEXT_PROMPT,"명령어를 입력해주세요");


    }

    async process(step){
        const luisResult = await dispatchRecognizer.recognize(step.context);
        console.log("luis pass In directDialog.js");
        intent =  LuisRecognizer.topIntent(luisResult);
        console.log(intent);//intent 확인되었나
        entities = luisResult.entities;

        if(intent ==='Add'){
            var userName = step.context._activity.from.name;
            await database.queryInsertAim(entities,userName,entities.context);
            step.context.sendActivity('목표가 추가되었습니다');
            endDialog = true;
            return await step.endDialog();

        }

        else if(intent ==='Delete'){
            var userName = step.context._activity.from.name;
            await database.queryDeleteAim(entities.AimyTableNumber,userName);
            step.context.sendActivity('목표가 삭제되었습니다');
            endDialog = true;
            return await step.endDialog();

        }

        else if(intent ==='Modify'){
            var userName = step.context._activity.from.name;

            endDialog = true;
            return await step.endDialog();
        }


    
        else if(intent ==='방참가하기'){
            var userName = step.context._activity.from.name;
            await database.queryRoomEnter(userName,entities.AimyTableNumber);
            

            endDialog = true;
            return await step.endDialog();
        

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