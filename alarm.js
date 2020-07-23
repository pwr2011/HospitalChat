const schedule = require('node-schedule');


var job = schedule.scheduleJob('20 56 12 * * *',function(){
    let mNow = new Date();
    console.log(mNow);
    
});

module.exports.job = job;