const {calcMd5} = require('./baseutils')
const fs = require('fs')

console.log(calcMd5(fs.readFileSync('对比数据/ifc/new')))
console.log(calcMd5(fs.readFileSync('对比数据/ifc/target')))
