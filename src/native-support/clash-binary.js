const path = require('path')
const { exec } = require('child_process');
const spawnSync = require('child_process').spawnSync
const execa = require('execa')
const fs = require('fs')
const log = require('electron-log')

const { isElectronDebug, getDataPath, isWindows, isLinux } = require('./utils')
const { switchToCurrentProfile } = require('./profiles-manager')

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

function _spawnClash() {
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
    // let cmd = clashPath + ' -d ' + path.join(getDataPath(true), 'clash-configs')
    // if (configName != null && configName.length !== 0) {
    //     cmd += '-c ' + configName
    // }
    let args = ['-d', path.join(getDataPath(), 'clash-configs')]
    clashProcess = execa(clashPath, args, {
        windowsHide: true,
        detached: true
    })
    // clashProcess = exec(cmd, { detached: true }, (err) => {
    //     if (!exiting) {
    //         _killClash()
    //         _spawnClash()
    //         log.error(
    //             `Clash process exit with signal: ${err ? err.signal : 'null'}. \n
    //             Code: ${err ? err.code : 'null'}; \n
    //             Stack: ${err ? err.stack : 'null'}. \n
    //             --------------------------------------`
    //         )
    //     }
    // })
    // setTimeout(() => {
    //     switchToCurrentProfile()
    // }, 500)
    clashProcess.stderr.on('data', (data) => {
        log.error(`[Clash Core Error]: \n${data}\n`)
    })
    clashProcess.on('exit', _onProcessExit)
    clashProcess.on('error', _onProcessExit)
    clashProcess.on('close', _onProcessExit)

    setTimeout(() => {
        switchToCurrentProfile()
    }, 500)

    exiting = false
}

function _onProcessExit(err) {
    log.info(`[Clash Core Exited]: \n${new Error().stack}\n`)
    if (!exiting) {
        _killClash()
        _spawnClash()
        if (typeof err === 'object') {
            log.error(
                `Clash process exit with signal: ${err ? err.signal : 'null'}. \n
                Code: ${err ? err.code : 'null'}; \n
                Stack: ${err ? err.stack : 'null'}. \n
                --------------------------------------`
            )
        } else {
            log.error(`Clash process exit with code: ${err}`)
        }
    }
}

function _killClash() {
    exiting = true
    if (clashProcess) {
        if (isWindows()) {
            spawnSync("taskkill", ["/pid", clashProcess.pid, '/f', '/t'])
        } else if(isLinux()) {
            exec(`kill $(ps -o pid= --ppid ${clashProcess.pid})`)
        } else if (clashProcess.kill) {
            clashProcess.kill('SIGINT')
        } else if (clashProcess.pid) {
            process.kill(clashProcess.pid, 'SIGINT')
        }
        clashProcess = null
    }
}


module.exports = {
    getClashBinaryPath: _getClashBinaryPath,
    spawnClash: _spawnClash,
    killClash: _killClash
}
