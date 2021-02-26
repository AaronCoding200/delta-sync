const axios = require('axios');
const fs = require('fs')
const FormData = require('form-data');

const api = axios.create({
    baseURL: "http://localhost:18080",
    maxBodyLength: 5 * 1024 * 1024 * 1024,
    headers: {
        'Authorization': 'bearer eyJhbGciOiJSUzI1NiJ9.eyJ1c2VyX2lkIjpudWxsLCJ1c2VyX25hbWUiOiJiaW1ib3gudXNlckBhZWN3b3Jrcy5jbiIsInNjb3BlIjpbIm9idjpyZWFkIiwib2J2OndyaXRlIiwiY29sbGFiOnJlYWQiLCJjb2xsYWI6d3JpdGUiLCJib3g6cmVhZCIsImJveDp3cml0ZSJdLCJleHAiOjk5OTk5OTk5OTk5OTksImNsaWVudF9pZCI6ImFjbWUiLCJhdXRob3JpdGllcyI6WyJST0xFX1VTRVIiLCJST0xFX1VTRVJfQURNSU4iLCJST0xFX0FETUlOIl0sImp0aSI6Imp0aSJ9.JnV92vmpwEdbCe3J76ZlVf4Cbdxftk8KgSnGtrcKHoah_a35bwLpTG52nawVUZMmjWF8a8UfOHn1p2mKMklo-Sc3owIBfUYhZzJY7ttIK6Hfs8hUPD6_3uNtsBUNnriRFkSxd1gXnQLf0gbDcHQCfumqtXM7BTGvT9MJKrnzU7u3UyzCDXRorHFioUHIW__Plh0MK5fZW6QYy0B7Ctd9SmPzkvRNaClvMwwbbfSn1GDKSJAEWi4f_l1RQeZsygaQc-rG0kkfDWjP8nzF88ywMseqL3cHClzHu_eocjqxhAgf-XxIYCgv8Hl7HPF-yT8bYJPPPsAjwTfP3qCdPbJSpQ'
    }
});

/**
 * 获取上传url
 */
const getUploadUrl = async () => {
    const projectId = '4vdhw9xZQLV'
    const folderId = '@root'

    const {data} = await api.get('/bimserver/sfs/v3/uploadUrl', {
        params: {
            "type": 5,
            projectId,
            folderId,
            "expire": 600000
        }
    });
    return {uploadUrl: data.data.uploadUrl, signature: data.data.signature}
}

/**
 * 全量上传
 */
const fullUpload = async (url, signature, filePath) => {
    const formData = new FormData({maxDataSize: 5 * 1024 * 1024 * 1024});
    formData.append('file', fs.createReadStream(filePath));

    const {data} = await api.put(url, formData, {
        headers: {
            ...formData.getHeaders(),
            "x-bimserver-upload-url": signature
        }
    })
    return data
}

/**
 * 上传sign文件
 */
const uploadSign = async (fileId, signStr) => {
    const formData = new FormData({maxDataSize: 5 * 1024 * 1024 * 1024});
    formData.append('fileId', fileId);
    formData.append('signFile', Buffer.from(signStr), {filename: 'sigh'});

    await api.post('/zuul/bimserver/sfs/v3/delta/uploadSign', formData, {
        headers: formData.getHeaders()
    });
};

/**
 * 下载sign文件
 */
const downloadSign = async (fileId) => {
    const {data} = await api.get('/bimserver/sfs/v3/delta/downloadSign', {
        params: {fileId}
    });
    return data;
}

/**
 * 上传差异文件
 */
const uploadDelta = async (fileId, deltaNum, deltaFile) => {

    const formData = new FormData({maxDataSize: 5 * 1024 * 1024 * 1024});
    formData.append('fileId', fileId);
    formData.append('deltaNum', deltaNum);
    formData.append('deltaFile', deltaFile, {filename: 'delta'});

    await api.post('/zuul/bimserver/sfs/v3/delta/uploadDelta', formData.getBuffer(), {
        headers: formData.getHeaders()
    }).catch(err => {
        console.log(err)
        throw err
    });
};

/**
 * 合并文件
 */
const patch = async (fileId, md5, deltaResult, partSize) => {
    await api.post('/bimserver/sfs/v3/delta/patch', {fileId, md5, deltaResult, partSize})
        .catch(err => {
            console.log(err)
            throw err
        })
};

module.exports = {getUploadUrl, fullUpload, uploadSign, downloadSign, uploadDelta, patch}