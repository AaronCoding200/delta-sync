const SparkMD5 = require('spark-md5')

const calcChecksum = (buffer) => {
    let A = 0;
    let B = 0;
    for (let i = 0; i < buffer.length; i++) {
        A += buffer[i];
        B += A;
    }
    A = A & 0xffff;
    B = B & 0xffff;
    return A + (B << 16);
};

const calcNextChecksum = (oldChecksum, len, oldStartByte, newEndByte) => {
    let A = oldChecksum & 0xffff;
    let B = (oldChecksum - A) >> 16;
    A -= oldStartByte;
    A += newEndByte;
    B -= len * oldStartByte;
    B += A;
    A = A & 0xffff;
    B = B & 0xffff;
    return A + (B << 16);
};

const calcMd5 = (buffer) => {
    const md5 = new SparkMD5.ArrayBuffer().append(buffer).end(false).toUpperCase()
    return _removeStartZero(md5)
}

const _removeStartZero = md5 => {
    return md5.startsWith('0') ? _removeStartZero(md5.substring(1)) : md5;
}

const getChunks = (file, partSize) => {
    const chunks = [];

    let start = 0, end = 0;
    while (true) {
        end += partSize;
        const part = file.slice(start, end);
        start += partSize;
        if (part.length) {
            chunks.push(part);
        } else {
            break;
        }
    }

    return chunks;
}

const checkKey = (sign, checksum, md5AtIndex) => {
    if (sign[checksum]) {
        let sameIndex = 1;
        while (true) {
            const key = checksum + '@' + sameIndex;

            if (!sign[key]) {
                sign[key] = md5AtIndex;
                break;
            }

            sameIndex++;
        }
    } else {
        sign[checksum] = md5AtIndex;
    }
}

const getMd5Index = (md5AtIndex) => {
    const index = md5AtIndex.lastIndexOf('@');
    return {
        md5: md5AtIndex.slice(0, index),
        index: md5AtIndex.slice(index + 1)
    }
}

const judgeStartEnd = (start, end) => {
    if (start === end) {
        return start.toString();
    } else {
        return `[${start},${end}]`;
    }
}

const handleCheckResult = (checkResult, hitRate) => {
    const parts = [];
    const result = [];
    let start = null, end = null;

    for (let i = 0; i < checkResult.length; i++) {
        if (checkResult[i] instanceof Buffer) {
            if (start !== null) {
                result.push(judgeStartEnd(start, end));
                start = null;
                end = null;
            }

            parts.push({
                num: result.length,
                part: checkResult[i]
            });
            result.push('~');
            continue;
        }

        const num = ~~checkResult[i];

        if (start !== null) {

            if (num === end + 1) {
                end = num;
                continue;
            }

            result.push(judgeStartEnd(start, end));

            start = num;
            end = num;

        } else {
            start = num;
            end = num;
        }
    }

    if (start !== null) {
        result.push(judgeStartEnd(start, end));
    }

    return {
        parts,
        result,
        hitRate: Math.round(((hitRate) * 10000)) / 100.00.toFixed(2) + '%'
    }
}

const objToMap = (obj, keyToNumber) => {
    let map = new Map();
    for (const k of Object.keys(obj)) {
        if (keyToNumber) {
            map.set(Number(k), obj[k]);
        } else {
            map.set(k, obj[k]);
        }
    }
    return map;
}

module.exports = {
    calcChecksum,
    calcNextChecksum,
    calcMd5,
    getChunks,
    checkKey,
    getMd5Index,
    judgeStartEnd,
    handleCheckResult,
    objToMap
}