import fs from 'fs'

function unLink(localPath) {

    if (!localPath) return null

    fs.unlinkSync(localPath)
}

export { unLink }