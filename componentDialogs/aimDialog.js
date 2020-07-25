//목표에 관한 기능을 제공하는 Aim dialog가 구현되어 있다.

//waterfall dialog를 구현하기 위한 require이다.
const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const { ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

//Luis를 사용하기 위한 require이다.
const { LuisRecognizer } = require('botbuilder-ai');

//database 접근을 위한 require이다.
const { database } = require('../DBconnect');

//사용할 dialog들을 편하게 사용하기 위해 선언하는 함수들이다.
const AIM_DIALOG = 'AIM_DIALOG';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

const DATETIME_PROMPT = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = '';

//Luis Recognizer를 연결한 변수이다.
const dispatchRecognizer = new LuisRecognizer({
    applicationId: process.env.LuisAppId,
    endpointKey: process.env.LuisAPIKey,
    endpoint: `https://${process.env.LuisAPIHostName}.api.cognitive.microsoft.com`
}, {
    includeAllIntents: true

}, true);


var entities; //루이스결과를 저장할 엔티티 변수
var context; //목표내용 변수
var modifycontent;//수정할내용 변수
var aimNumber = -1 //목표 번호를 저장함 디폴트는 -1
var luisResult;


//aimDialog class
class aimDialog extends ComponentDialog {

    constructor() {
        super(AIM_DIALOG);

        //사용할 prompt를 addDialog로 선언해준다.
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));


        //waterfall Dialog의 step을 bind로 선언해준다.
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.choiceStep.bind(this), //목표에 대해 추가 ,삭제, 수정 중 하나 선택
            this.detailStep.bind(this),  // 각각에 대한 이름
            this.typingStep.bind(this),  // 내용 타이핑 
            this.secondChoice.bind(this), //주기 타이핑
            this.summaryStep.bind(this), //요약
            this.processStep.bind(this) //DB처리 부분

        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    //목표에 대해 추가 ,삭제, 수정 중 하나 선택
    async choiceStep(step) {
        endDialog = false;

        //Choice prompt로 선택지를 제공한다.
        return await step.prompt(CHOICE_PROMPT, '명령을 선택해주세요', ['추가', '삭제', '수정']);
    }

    //목표에 대한 추가 삭제 수정에 따라 필요한 값들을 받는 step
    async detailStep(step) {

        //이전 단계에서 Choice_prompt로 전달받은 결과를 step.values.choice에 저장한다.
        step.values.choice = step.result;

        if (step.result.value === '추가') {

            //Text_prompt로 어떤 목표를 추가할지 입력받는다.
            return await step.prompt(TEXT_PROMPT, '어떤 목표를 추가할까요?');
        }

        else if (step.result.value === '삭제') {
            //목표 리스트 보여주는 함수

            //유저의 고유 아이디를 가져옴
            //유저의 고유 아이디를 이용하여 유저의 목표 목록을 보여줌
            var userName = step.context._activity.from.name;
            var res = await database.queryShowAim(userName);
            const rows = res.rows;
            rows.map(row => {
                step.context.sendActivity(`${this.showAimClearAll(row)}`);
            });

            //Text_prompt로 삭제할 목표의 번호를 입력받는다.
            return await step.prompt(TEXT_PROMPT, '삭제할 목표의 번호를 입력해주세요');
        }

        else if (step.result.value === '수정') {

            //유저의 고유 아이디를 가져옴
            //유저의 고유 아이디를 이용하여 유저의 목표 목록을 보여줌
            var userName = step.context._activity.from.name;
            var res = await database.queryShowAim(userName);
            const rows = res.rows;
            rows.map(row => {
                step.context.sendActivity(`${this.showAimClearAll(row)}`);
            });

            //목표 목록을 보고 수정할 목표 번호를 text prompt로 받는다.
            return await step.prompt(TEXT_PROMPT, '수정할 목표의 번호를 입력해주세요');
        }
    }

    //추가인 경우 사용자가 직접 텍스트를 입력하여 목표기간을 입력하고, 수정인 경우 수정할 부분을 선택하도록 하는 step
    async typingStep(step) {

        if (step.values.choice.value === '추가') {

            //목표 내용이 저장됨
            context = step.result;

            //목표 기간과 주기를 입력받는다.
            return await step.prompt(TEXT_PROMPT, '목표 기간과 주기를 지정해주세요 예: 0월 0일 부터 0일 0일까지 0일마다');
        }

        else if (step.values.choice.value === '삭제') {

            //삭제 리스트 번호가 저장됨
            aimNumber = step.result;
            return await step.continueDialog();
        }

        else if (step.values.choice.value === '수정') {

            //수정 리스트 번호가 저장됨
            aimNumber = step.result;

            //choice prompt로 선택지를 준다.
            return await step.prompt(CHOICE_PROMPT, '목표의 어느 부분을 수정하시겠어요?', ['목표내용', '기간', '수행주기']);
        }
    }
    //추가하는 경우 루이스와 연동하여 텍스트를 분석하고 DB에 목표를 추가하게 함
    async secondChoice(step) {

        if (step.values.choice.value === '추가') {
            
            //recognize함수를 이용하여 입력받은 값들을 분리한다.
            const luisResult = await dispatchRecognizer.recognize(step.context);
            const intent = LuisRecognizer.topIntent(luisResult);
            entities = luisResult.entities;

            //intent가 제대로 입력되었는지 확인한다.
            if (intent === 'Add') {

                return await step.continueDialog();
            }

            //제대로 luis가 입력받지 못했다면 dialog를 종료한다.
            else if (intent === 'None') {
                await step.context.sendActivity('유효하지 않은 기간 설정입니다.');
                endDialog = true;
                return await step.endDialog();
            }
        }

        //삭제이면
        else if (step.values.choice.value === '삭제') {
            return await step.continueDialog();
        }

        else if (step.values.choice.value === '수정') {

            if (step.result.value === '목표내용') {

                //어떤 부분을 수정할지는 modifyWhat 에 저장함
                step.values.modifyWhat = step.result;

                //text prompt로 목표의 내용을 입력받는다.
                return await step.prompt(TEXT_PROMPT, '목표를 뭘로 수정할까요?');
            }

            else if (step.result.value === '기간') {

                //어떤 부분을 수정할지는 modifyWhat 에 저장함
                step.values.modifyWhat = step.result;

                //text prompt로 목표의 기간을 입력받는다.
                return await step.prompt(TEXT_PROMPT, '기간을 어떻게 수정할까요?');

            }
            else if (step.result.value === '수행주기') {
                
                //어떤 부분을 수정할지는 modifyWhat 에 저장함
                step.values.modifyWhat = step.result;

                //text prompt로 목표의 주기를 입력받는다.
                return await step.prompt(NUMBER_PROMPT, '수행주기를 몇일로 수정할까요?');
            }
        }
    }

    //지금까지의 과정을 요약하여 확인을 받는 step
    async summaryStep(step) {

        if (step.values.choice.value === '추가') {

            //choice prompt로 입력이 맞는지 확인받는다.
            return await step.prompt(CHOICE_PROMPT, `목표: ${context}  \r\n 기간 :${entities.startTime_month}월 ${entities.startTime_day}일 부터 ${entities.endTime_month}월 ${entities.endTime_day}일 까지 \r\n 주기: ${entities.timeCycle} \r\n 맞습니까?`, ['네', '아니오']);
        }

        //삭제 이면
        else if (step.values.choice.value === '삭제') {

            //choice prompt로 입력이 맞는지 확인받는다.
            return await step.prompt(CHOICE_PROMPT, `${aimNumber}번 목표 삭제할까요?`, ['네', '아니오']);
        }

        else if (step.values.choice.value === '수정') {
            modifycontent = step.result;

            //recognize 함수로 수정받을 내용을 인식한다.
            luisResult = await dispatchRecognizer.recognize(step.context);
            const intent = LuisRecognizer.topIntent(luisResult);
            entities = luisResult.entities;

            //choice prompt로 입력한 내용이 인식되었는지 확인한다.
            return await step.prompt(CHOICE_PROMPT, `${step.values.modifyWhat.value}을 ${step.result}일로 바꾸는 것이 맞습니까?`, ['네', '아니오']);
        }
    }

    //postgresDB와 연동하여 자료를 저장하는 step
    async processStep(step) {

        if (step.values.choice.value === '추가') {

            //목표 추가
            if (step.result.value === '네') {

                //query의 실행을 위해 userName 입력받는다.
                var userName = step.context._activity.from.name;
                await database.queryInsertAim(entities, userName, context);
                await step.context.sendActivity('목표 입력이 완료되었습니다.');
                endDialog = true;
                return await step.endDialog();
            }

            //목표 추가 취소
            else if (step.result.value === '아니오') {
                await step.context.sendActivity('목표 추가를 취소하셨습니다.');
                endDialog = true;
                return await step.endDialog();
            }
        }

        else if (step.values.choice.value === '삭제') {

            //삭제를 진행한다.
            if (step.result.value === '네') {

                //query실행을 위한 userName을 저장한다.
                var userName = step.context._activity.from.name;

                //삭제 디비함수
                await database.queryDeleteAim(aimNumber, userName);
                await step.context.sendActivity('목표 삭제가 완료되었습니다.');
                endDialog = true;
                return await step.endDialog();
            }

            //삭제 취소
            else if (step.result.value === '아니오') {
                await step.context.sendActivity('취소되었습니다.');
                endDialog = true;
                return await step.endDialog();
            }
        }

        else if (step.values.choice.value === '수정') {

            //목표를 수정
            if (step.result.value === '네') {
                if (step.values.modifyWhat.value === '목표내용') {

                    //목표수정
                    await database.queryModifyAimContext(aimNumber, modifycontent);
                    await step.context.sendActivity('목표내용 수정이 완료되었습니다.');
                    endDialog = true;
                    return await step.endDialog();
                }

                //목표 기간 수정
                else if (step.values.modifyWhat.value === '기간') {

                    await database.queryModifyAimTime(aimNumber, entities);
                    await step.context.sendActivity('목표기간 수정이 완료되었습니다.');
                    endDialog = true;
                    return await step.endDialog();
                }

                //목표 수행주기 수정
                else if (step.values.modifyWhat.value === '수행주기') {

                    //수행주기를 파라미터로 넘김
                    await database.queryModifyAimAchievecycle(aimNumber, modifycontent);
                    await step.context.sendActivity('목표주기 수정이 완료되었습니다.');
                    return await step.endDialog();
                }
            }

            //수정 취소
            else if (step.result.value === '아니오') {

                await step.context.sendActivity('목표 수정을 취소하셨습니다.');
                endDialog = true;
                return await step.endDialog();
            }
        }
    }


    //목표 목록을 보여줄때 사용되는 함수
    showAimClearAll(row) {
        var msg = `aim id : ${row.aimid} 목표 : ${row.context} \r\n 목표 주기 : ${row.achievecycle}일에 한번
        \r\n 시작일 : ${row.starttimemonth} 월 ${row.starttimeday}\r\n 종료일 :${row.endtimemonth} 월 ${row.endtimeday}`;
        return msg;
    }

    //waterfalldiaglog가 끝났는지 확인하는 함수
    async isDialogComplete() {
        return endDialog;
    }

}

module.exports.aimDialog = aimDialog;
module.exports.AIM_DIALOG = AIM_DIALOG;

