const { BRG_MSG_SET_PORT} = require('./message-constants')
const { setHttpPort, setSocksPort } = require('./configs-manager')

const IPCCalls = {
    [BRG_MSG_SET_PORT]: (args) => {
        const { httpPort, socksPort } = args
        if (httpPort) {
            setHttpPort(httpPort)
        }
        if (socksPort) {
            setSocksPort(socksPort)
        }
        return Promise.resolve()
    }
}

module.exports = {
    IPCCalls
}