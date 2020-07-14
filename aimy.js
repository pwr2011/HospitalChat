// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { makeDialog } = require('./componentDialogs/makeDialog')
const { pg } = require('./DB.js');

class AIMY extends ActivityHandler {
    constructor(conversationState,userState) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = conversationState.createProperty("dialogState");
        this.makeDialog = new makeDialog(this.conversationState,this.userState);

        
        this.previousIntent = this.conversationState.createProperty("previousIntent");
        this.conversationData = this.conversationState.createProperty('conservationData');
        
        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${process.env.LuisAPIHostName}.api.cognitive.microsoft.com`
        }, {
            includeAllIntents: true
        }, true);


        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            //const luisResult = await dispatchRecognizer.recognize(context);
            
            //const intent = LuisRecognizer.topIntent(luisResult);
            //const entities = luisResult.entities;
            await this.dispatchToIntentAsync(context);
            //const replyText = `TopScoring Intent : ${LuisRecognizer.topIntent(luisResult)}`;
            //await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });   

        this.onMembersAdded(async (context, next) => {
            
            await this.sendwelcomeMessage(context);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async sendwelcomeMessage(turnContext) {
        const { activity } = turnContext;

        for (const idx in activity.membersAdded) {
            if (activity.membersAdded[idx].id !== activity.recipient.id) {
                const inputNameMessage = `이름을 입력해주세요!`;
                //await turnContext.sendActivity(inputNameMessage);
                const welcomeMessage = `안녕하세요. AIMY입니다. 무엇을 도와드릴까요 ${activity.membersAdded[idx].name} 님?`;
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }
    async sendSuggestedActions(turnContext) {
        var reply = MessageFactory.suggestedActions(['일정', '목표', '스케쥴 확인'], 'AIMy의 기능을 선택해주세요...★');
        await turnContext.sendActivity(reply);
    }

    async dispatchToIntentAsync(context) {//, intent, entities
        console.log("여기까지는 된다!")

        var currentIntent = '';
        const previousIntent = await this.previousIntent.get(context,{});
        const conversationData = await this.conversationData.get(context,{});   

        if(previousIntent.intentName && conversationData.endDialog === false )
        {
           currentIntent = previousIntent.intentName;

        }
        else if (previousIntent.intentName && conversationData.endDialog === true)
        {
             currentIntent = context.activity.text;

        }
        else
        {
            currentIntent = context.activity.text;
            await this.previousIntent.set(context,{intentName: context.activity.text});

        }

        //Luis 관련 코드 지금은 사용 안하기에 주석처리 함.
        // const previousIntent = await this.previousIntent.get(context, {});
        // const conversationData = await this.conversationData.get(context, {});

        // if (previousIntent.intentName && conversationData.endDialog === false) {
        //     currentIntent = previousIntent.intentName;

        // }
        // else if (previousIntent.intentName && conversationData.endDialog === true) {
        //     currentIntent = intent;

        // }
        // else {
        //     currentIntent = intent;
        //     await this.previousIntent.set(context, { intentName: intent });

        // }
        switch (currentIntent) {
            case 'plan':
                var msg = '일정을 생성합니다!';
                await context.sendActivity(msg);
                await this.conversationData.set(context,{endDialog: false});
                await this.makeDialog.run(context,this.dialogState);
                conversationData.endDialog = await this.makeReservationDialog.isDialogComplete();
                if(conversationData.endDialog)
                {
                    await this.sendSuggestedActions(context);

                }
            break;

            case 'purpose':
                    var msg = '안녕하세요! AIMY는 의지가 부족한 우리를 위해 만들어진 동기부여 스케줄러 입니다!'
                    await context.sendActivity(msg)
                break;

            case 'schedule':
                var msg = '스케줄을 생성/삭제 합니다!'
                await context.sendActivity(msg);
                break;
            case 'name':
                var msg = '제 이름은 AIMY, 챗봇이죠!'
                await context.sendActivity(msg);
            break;
            default:
                console.log("Did not match any case");
                break;
        }


    }
}

module.exports.AIMY = AIMY;
