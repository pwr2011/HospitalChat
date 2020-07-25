const { ActivityHandler } = require('botbuilder');
const {MainDialog} = require('../componentDialogs/mainDialog');
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
        this.MainDialog = new MainDialog(this.userState);
       

        

       // this.previousIntent = this.conversationState.createProperty("previousIntent");
        // this.conversationData = this.conversationState.createProperty('conservationData');

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
       this.onMessage(async (context, next) => {
            console.log("onMessage 진입");
            
           // await this.dialog.run(context,this.dialogState); // 최영진


            if(context.activity.text==="login"){

                await context.sendActivity({ attachments: [CardFactory.adaptiveCard(adaptiveCard)] });

            }
            else if(context.activity.value != undefined){
                var user = context.activity.value;
                await context.sendActivity("hello , your username : " + user.username + ",password :" + user.password);

            }else {
                await this.dialog.run(context,this.dialogState); 
            }

            console.log("onMessage 통과");
            // By calling next() you ensure that the next BotHandler is run.
            //밑에 삭제되어야 함.
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
        var isEnd = await this.MainDialog.isEndDialog();
        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
        
        if(isEnd)
        {
            await super.run(context);
        }
    }

    
}

module.exports.DialogBot = DialogBot;