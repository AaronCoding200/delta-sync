const fs = require("fs")
const baseutils = require('./baseutils')

const getSign = (filePath, partSize) => {
    const data = fs.readFileSync(filePath)

    let chunkList = baseutils.getChunks(data, partSize)
    let count = 0
    let sign = {}

    while (true) {
        if (count === chunkList.length) {
            return JSON.stringify(sign)
        }

        const chunk = chunkList[count]

        const md5Value = baseutils.calcMd5(chunk) + '@' + count
        const checksum = baseutils.calcChecksum(chunk, 0, chunk.length)

        baseutils.checkKey(sign, checksum, md5Value)

        count++
    }
}

module.exports = {getSign}