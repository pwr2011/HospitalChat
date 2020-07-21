const { ActivityHandler } = require('botbuilder');

class DialogBot extends ActivityHandler {
    constructor(conversationState, userState,dialog) {
        super();
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');






        //User state와 dialog State를 저장하기 위함
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog; // 최영진 
        this.dialogState = conversationState.createProperty("dialogState");

       // this.makeDialog = new makeDialog(this.conversationState, this.userState);

        

       // this.previousIntent = this.conversationState.createProperty("previousIntent");
        // this.conversationData = this.conversationState.createProperty('conservationData');

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            console.log("onMessage 진입");
            await this.dialog.run(context,this.dialogState); // 최영진
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        // this.onDialog(async (context, next) => {
        //     console.log("onDialog 진입!");
        //     // Save any state changes. The load happened during the execution of the Dialog.
        //     await this.conversationState.saveChanges(context, false);
        //     await this.userState.saveChanges(context, false);
        //     await next();
        // });

        // this.onMembersAdded(async (context, next) => {
        //     console.log("onMembersAdded 진입!");
        //     await this.sendwelcomeMessage(context);
        //     await this.sendSuggestedActions(context);
        //     // By calling next() you ensure that the next BotHandler is run.
        //     await next();
        // });
        
        
    }
    async run(context) {
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }

    // async sendwelcomeMessage(turnContext) {
    //     console.log("sendwelcomeMessage 진입!");
    //     const { activity } = turnContext;
    //     for (const idx in activity.membersAdded) {
    //         if (activity.membersAdded[idx].id !== activity.recipient.id) {
    //             //console.log(activity.from.name);
    //             var userName = activity.from.name;
    //             const welcomeMessage = `안녕하세요. ${userName}. 저는 AIMY입니다.`;
    //             await turnContext.sendActivity(welcomeMessage);
                
    //         }
    //     }
    // }
    // async sendSuggestedActions(context, entities) {
    //     console.log("sendSuggestedActions 진입");

    //     var currentIntent = '';
    //     const previousIntent = await this.previousIntent.get(context, {});
    //     const conversationData = await this.conversationData.get(context, {});

    //     if (previousIntent.intentName && conversationData.endDialog === false) {
    //         currentIntent = previousIntent.intentName;
    //     }
    //     else if (previousIntent.intentName && conversationData.endDialog === true) {
    //         currentIntent = context.activity.text;

    //     }
    //     else {
    //         currentIntent = context.activity.text;
    //         await this.previousIntent.set(context, { intentName: context.activity.text });
    //     }

    //     await this.conversationData.set(context, { endDialog: false });
    //     await this.makeDialog.run(context, this.dialogState); //entities 추가
    //     conversationData.endDialog = await this.makeDialog.isDialogComplete();

    //     if (conversationData.endDialog) {
    //         await this.sendSuggestedActions(context);

    //     }
    // }

    // async dispatchToIntentAsync(context) {//, intent, entities
    //     console.log("dispatchToIntentAsync함수로 진입");

    //     var currentIntent = '';
    //     const previousIntent = await this.previousIntent.get(context, {});
    //     const conversationData = await this.conversationData.get(context, {});

    //     if (previousIntent.intentName && conversationData.endDialog === false) {
    //         currentIntent = previousIntent.intentName;

    //     }
    //     else if (previousIntent.intentName && conversationData.endDialog === true) {
    //         currentIntent = context.activity.text;

    //     }
    //     else {
    //         currentIntent = context.activity.text;
    //         await this.previousIntent.set(context, { intentName: context.activity.text });

    //     }
    //     switch (currentIntent) {
    //         case 'plan':
    //             await this.conversationData.set(context, { endDialog: false });
    //             await this.makeDialog.run(context, this.dialogState);
    //             conversationData.endDialog = await this.makeDialog.isDialogComplete();

    //             if (conversationData.endDialog) {
    //                 await this.sendSuggestedActions(context);

    //             }
    //             break;

    //         case 'purpose':
    //             var msg = '안녕하세요! AIMY는 의지가 부족한 우리를 위해 만들어진 동기부여 스케줄러 입니다!'
    //             await context.sendActivity(msg)
    //             break;

    //         case 'schedule':
    //             var msg = '스케줄을 생성/삭제 합니다!'
    //             await context.sendActivity(msg);
    //             break;
    //         case 'name':
    //             var msg = '제 이름은 AIMY, 챗봇이죠!'
    //             await context.sendActivity(msg);
    //             break;
    //         default:
    //             console.log("Did not match any case");
    //             break;
    //     }


    // }
}

module.exports.DialogBot = DialogBot;