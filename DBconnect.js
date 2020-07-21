//aimDialog와 roomDialog에서 둘다 database를 접근하기 위해 따로 생성함
const { DB } = require('./DB');

const database = new DB();

module.exports.database = database;