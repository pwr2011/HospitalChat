// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');

class AIMY extends ActivityHandler {
    constructor() {
        super();

        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${process.env.LuisAPIHostName}.api.cognitive.microsoft.com`
        }, {
            includeAllIntents: true
        }, true);


        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const luisResult = await dispatchRecognizer.recognize(context);
            
            const intent = LuisRecognizer.topIntent(luisResult);
            const entities = luisResult.entities;
            console.log(intent);
            await this.dispatchToIntentAsync(context, intent,entities);
            //const replyText = `TopScoring Intent : ${LuisRecognizer.topIntent(luisResult)}`;
            //await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
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

    async dispatchToIntentAsync(context, intent, entities) {

        var currentIntent = intent;
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
