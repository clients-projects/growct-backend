const fs = require('fs')

const deleteFile = (filePath) => {
        fs.access(filePath, fs.F_OK, (err) => {
        if (err) {
            console.error(err)
            return
        }
        fs.unlink(filePath, (err) => {
            if (err) {
                throw new Error('unable to delete file')
            }
        })
        
    })
}

exports.deleteFile = deleteFile
