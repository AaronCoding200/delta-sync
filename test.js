const {calcMd5} = require('./baseutils')
const fs = require('fs')

console.log(calcMd5(fs.readFileSync('对比数据/rvt/new')))
console.log(calcMd5(fs.readFileSync('对比数据/rvt/2H145n2C8bP93EzDIt4KyOPN')))