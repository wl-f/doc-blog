const fs = window.require('fs').promises
const path = window.require('path')  // 直接require会被webpack拦截,去node_modules查找这个时候会找不到

const fileHelper = {
    readFile: (path) => {
        return fs.readFile(path, { encoding: 'utf8'})
    },
    writeFile: (path, content) => {
        return fs.writeFile(path, content, { encoding: 'utf8'})
    },
    renameFile: (path, newPath) => {
        return fs.rename(path, newPath)
    },
    deleteFile: (path) => {
        return fs.unlink(path)
    }
}

export default fileHelper
