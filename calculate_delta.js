const fs = require('fs')
const baseutils = require('./baseutils')

const getDelta = (newFilePath, sign, partSize) => {

    const file = fs.readFileSync(newFilePath)

    const checkResult = [];

    let start = 0, end = partSize, fragmentIndex = 0, has = false, checksum = null, hit = 0;

    while (true) {
        has = false;
        const part = file.slice(start, end);

        if (!part.length) {
            console.log('命中率:', Math.round(((hit / Object.keys(sign).length) * 10000)) / 100.00.toFixed(2) + '%')
            return baseutils.handleCheckResult(checkResult)
        }

        checksum = !checksum ? baseutils.calcChecksum(part) :
            baseutils.calcNextChecksum(checksum, part.length, file[start - 1], file[end - 1])

        if (sign[checksum]) {
            const md5 = baseutils.calcMd5(part)
            const valueObj = baseutils.getMd5Index(sign[checksum]);

            if (md5 === valueObj.md5) {
                if (start !== fragmentIndex) {
                    checkResult.push(file.slice(fragmentIndex, start));
                }

                checkResult.push(valueObj.index);
                start += partSize;
                end += partSize;
                has = true;
                fragmentIndex = start;
                checksum = null
                hit++
            }
        }

        if (!has) {
            start++;
            end++;
        }

        if (part.length < partSize) {
            if (!has) {
                checkResult.push(file.slice(fragmentIndex));
            }
            console.log('命中率:', Math.round(((hit / Object.keys(sign).length) * 10000)) / 100.00.toFixed(2) + '%')
            return baseutils.handleCheckResult(checkResult)
        }
    }
}

module.exports = {getDelta}