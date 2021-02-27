const path = require('path')
const { exec } = require('child_process');
const spawn = require('child_process').spawnSync
const fs = require('fs')
const log = require('electron-log')

const { isElectronDebug, getDataPath, isWindows, isLinux } = require('./utils')
const { switchToCurrentProfile } = require('./profiles-manager');

var clashProcess = undefined
var exiting = false

function _getClashBinaryPath() {
    let platform = ''
    let ret = 'clash-'
    let arch = ''
    switch (process.platform) {
        case 'linux':
            platform = 'linux-'
            break
        case 'win32':
            platform = 'windows-'
            break
        case 'darwin':
            platform = 'darwin-'
            arch = 'amd64'
            break
        default:
            break
    }
    if (process.platform !== 'darwin') {
        if (process.arch === 'x64') {
            arch = 'amd64'
        } else {
            arch = '386'
        }
    }
    ret = ret + platform + arch
    ret = path.resolve(path.join(!isElectronDebug() ? process.resourcesPath : '.', 'clash-binaries', ret))
    if (isElectronDebug()) {
        console.log('Clash binary path = ' + ret)
    }
    return ret
}

function _spawnClash(configName) {
    if (clashProcess != null && !clashProcess.killed) {
        return
    }
    const clashPath = _getClashBinaryPath()
    if (!isWindows()) {
        try {
            fs.accessSync(clashPath, fs.constants.X_OK)
        } catch(e) {
            fs.chmodSync(clashPath, 0o755)
        }
    }
    let cmd = clashPath + ' -d ' + path.join(getDataPath(true), 'clash-configs')
    if (configName != null && configName.length !== 0) {
        cmd += '-c ' + configName
    }
    if (isElectronDebug()) {
        console.log('Spawn cmd = ' + cmd)
    }
    clashProcess = exec(cmd, { detached: true }, (err) => {
        if (!exiting) {
            _killClash()
            _spawnClash()
            log.error(`Clash process exit with signal: ${err ? err.signal : 'null'}. \n
Code: ${err ? err.code : 'null'}; \n
Stack: ${err ? err.stack : 'null'}. \n
--------------------------------------`)
        }
    })
    setTimeout(() => {
        switchToCurrentProfile()
    }, 500)
    exiting = false
}

function _killClash() {
    exiting = true
    if (clashProcess && clashProcess.kill) {
        if (isWindows()) {
            spawn("taskkill", ["/pid", clashProcess.pid, '/f', '/t'])
        } else if(isLinux()) {
            exec(`kill $(ps -o pid= --ppid ${clashProcess.pid})`)
        } else {
            clashProcess.kill('SIGINT')
        }
        clashProcess = null
    }
}


module.exports = {
    getClashBinaryPath: _getClashBinaryPath,
    spawnClash: _spawnClash,
    killClash: _killClash
}
