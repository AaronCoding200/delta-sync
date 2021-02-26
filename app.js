const api = require('./api')
const {getSign} = require('./calculate_sign')
const {getDelta} = require('./calculate_delta')
const {calcMd5} = require('./baseutils')
const fs = require('fs')

/**
 * 文件夹名称
 */
const FOLDER_NAME = 'obmx';

/**
 * 一次上传最大并发数
 */
const TCP_MAX_ONCE_UPLOAD = 10;

/**
 * 分片大小， 100k
 */
const PART_SIZE = 100 * 1024;

const OLD_FILEPATH = `对比数据/${FOLDER_NAME}/old`
const NEW_FILEPATH = `对比数据/${FOLDER_NAME}/new`

let fileId;

const fullUpload = async () => {
    console.warn("----------全量上传---------- [原文件大小：" + (fs.readFileSync(OLD_FILEPATH).length / 1024 / 1024).toFixed(2) + 'MB]')

    console.time('1.获取上传url')
    const {uploadUrl, signature} = await api.getUploadUrl()
    console.timeEnd('1.获取上传url')

    console.time('2.上传完整文件')
    const fullUploadResult = await api.fullUpload(uploadUrl, signature, OLD_FILEPATH)
    fileId = fullUploadResult.data.id
    console.timeEnd('2.上传完整文件')

    console.time('3.上传sign')
    await api.uploadSign(fileId, getSign(OLD_FILEPATH, PART_SIZE))
    console.timeEnd('3.上传sign')
}

const deltaUpload = async () => {
    console.warn("\n----------增量上传---------- [新文件大小：" + (fs.readFileSync(NEW_FILEPATH).length / 1024 / 1024).toFixed(2) + 'MB]')
    console.time('1.下载sign文件')
    const sign = await api.downloadSign(fileId);
    console.timeEnd('1.下载sign文件')

    console.time('2.计算delta')
    const delta = getDelta(NEW_FILEPATH, sign, PART_SIZE)
    console.timeEnd('2.计算delta')
    console.log('delta:', delta)

    console.time('3.上传delta')
    await uploadDeltaPart(0, delta.parts);
    console.timeEnd('3.上传delta')

    console.time('4.合并')
    await api.patch(fileId, calcMd5(fs.readFileSync(NEW_FILEPATH)), delta.result, PART_SIZE);
    console.timeEnd('4.合并')

    console.time('5.上传sign')
    await api.uploadSign(fileId, getSign(NEW_FILEPATH, PART_SIZE));
    console.timeEnd('5.上传sign')
}

const uploadDeltaPart = async (index, deltaParts) => {
    let num = index;
    let tcp_num = 0;
    const uploadPartArr = [];

    while (tcp_num < TCP_MAX_ONCE_UPLOAD) {
        if (!deltaParts[num]) {
            break;
        }

        const deltaNum = deltaParts[num].num
        const deltaPart = deltaParts[num].part

        const uploadFunc = () => {
            return new Promise(async (resolve) => {
                const status = await api.uploadDelta(fileId, deltaNum, deltaPart);
                resolve(status);
            });
        };

        uploadPartArr.push(uploadFunc);

        num++;
        tcp_num++;
    }

    await Promise.all(uploadPartArr.map(v => v()));

    if (num < deltaParts.length) {
        await uploadDeltaPart(num, deltaParts);
    }
}

const start = async () => {
    console.time('总耗时')
    await fullUpload();
    console.timeEnd('总耗时')

    console.time('总耗时')
    await deltaUpload()
    console.timeEnd('总耗时')
}

_ = start()