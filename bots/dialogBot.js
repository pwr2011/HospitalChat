//유저로부터 메세지가 도착할때의 경우를 처리하는 
//bot handler함수 onMessage()가 구현되어 있다.

//activity handler는 dialog를 만들기 위해 필수적으로 require해야 한다.
const { ActivityHandler } = require('botbuilder');
const { MainDialog } = require('../componentDialogs/mainDialog');

//
class DialogBot extends ActivityHandler {
    constructor(conversationState, userState, dialog) {
        super();
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        //User state와 dialog State를 저장하기 위한 변수들이다.
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = conversationState.createProperty("dialogState");
        this.MainDialog = new MainDialog(this.userState);

        this.onMessage(async (context, next) => {
            console.log("onMessage 진입");

            //메세지가 들어온다면 밑의 run()함수를 작동시킨다.
            await this.dialog.run(context, this.dialogState);
            await next();
        });
    }

    //run()함수는 dialog의 핵심 함수로써 dialog step의 실행을 관리한다.
    async run(context) {
        console.log("dialogBot의 run 진입!");
        await super.run(context);
        var isEnd = await this.MainDialog.isEndDialog();
        
        // dialog의 실행에 발생하는 state 변화를 저장한다.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);

        if (isEnd) {
            await super.run(context);
        }
    }
}

module.exports.DialogBot = DialogBot;