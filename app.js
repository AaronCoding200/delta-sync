const api = require('./api')
const {getSign} = require('./calculate_sign')
const {getDelta} = require('./calculate_delta')
const {calcMd5} = require('./baseutils')
const fs = require('fs')

const oldFilePath = '对比数据/pdf/old'
const newFilePath = '对比数据/pdf/new'

const projectId = '4vdhw9xZQLV'
const folderId = '@root'
const TCP_MAX_ONCE_UPLOAD = 10;
const partSize = 100 * 1024

let fileId;

const fullUpload = async () => {
    console.time('全量上传')
    // 1. 获取上传url
    const getUploadUrlResult = await api.getUploadUrl(projectId, folderId)

    // 2. 全量上传文件
    const fullUploadResult = await api.fullUpload(getUploadUrlResult.data.uploadUrl, getUploadUrlResult.data.signature, oldFilePath)
    fileId = fullUploadResult.data.id

    // 3. 上传sign文件
    await api.uploadSign(fileId, getSign(oldFilePath, partSize))
    console.timeEnd('全量上传')
}

const deltaUpload = async () => {
    console.time('下载sign文件')
    const sign = await api.downloadSign(fileId);
    console.timeEnd('下载sign文件')

    console.time('计算delta')
    const delta = getDelta(newFilePath, sign, partSize)
    console.log('delta:', delta)
    console.timeEnd('计算delta')

    console.time('上传delta')
    await uploadDeltaPart(0, delta.deltaParts);
    console.timeEnd('上传delta')

    console.time('合并')
    await api.patch(fileId, calcMd5(fs.readFileSync(newFilePath)), delta.deltaResult, partSize);
    console.timeEnd('合并')

    console.time('上传sign')
    await api.uploadSign(fileId, getSign(newFilePath, partSize));
    console.timeEnd('上传sign')
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
    await fullUpload();

    await deltaUpload()
}

_ = start()