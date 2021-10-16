const path = require('path')
const { exec } = require('child_process');
const spawnSync = require('child_process').spawnSync
const execa = require('execa')
const fs = require('fs')
const log = require('electron-log')

const { isElectronDebug, getDataPath, isWindows, isLinux } = require('./utils')
const { switchToCurrentProfile } = require('./profiles-manager');
const { Stream } = require('stream');

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
    // clashProcess = exec(cmd, { detached: true, maxBuffer:  }, (err) => {
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
    let args = ['-d', path.join(getDataPath(), 'clash-configs')]
    const out = new Stream.Writable({
        write: (chunk, _, next) => {
            log.log(`${chunk}\n`)
            next()
        }
    })
    const err = new Stream.Writable({
        write: (chunk, _, next) => {
            log.error(`[Clash Core Error]:\n${chunk}\n`)
            next()
        }
    })
    clashProcess = execa(clashPath, args, {
        windowsHide: true,
        detached: true,
        stdio: ['ignore', out, err]
    })
    clashProcess.unref()

    clashProcess.on('exit', _onProcessExit('exit'))
    clashProcess.on('error', _onProcessExit('error'))

    setTimeout(() => {
        switchToCurrentProfile()
    }, 500)

    exiting = false
}

const _onProcessExit = (event) => {
    return (err) => {
        log.info(`[Clash Core Exited]: \nEvent:${event}\n \n${new Error().stack}\n`)
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
}

function _killClash() {
    exiting = true
    if (clashProcess) {
        if (isWindows()) {
            spawnSync("taskkill", ["/pid", clashProcess.pid, '/f', '/t'])
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
