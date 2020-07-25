//처음 유저가 챗봇과의 대화를 시작할때 작동하는 onMembersAdded()함수가 구현되어있다.


const { DialogBot } = require('./dialogBot');

class DialogAndWelcomeBot extends DialogBot {
    constructor(conversationState, userState, dialog) {
        super(conversationState, userState, dialog);

        //onMembersAdded는 bot handler로써 유저가 처음 들어왔을때 작동한다.
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;

            //새로온 유저를 확인한다.
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    const reply = `안녕하세요 ${membersAdded[cnt].name}님 \n 계속하시려면 아무 말이나 눌러주세요`;
                    await context.sendActivity(reply);
                }
            }

            // bot handler의 작업이 끝나면 next()를 호출해줘야 한다.
            await next();
        });
    }
}

module.exports.DialogAndWelcomeBot = DialogAndWelcomeBot;