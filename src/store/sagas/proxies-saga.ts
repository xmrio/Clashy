import { take, put, call } from 'redux-saga/effects'
import { ProxiesAction, gotProxies } from '../actions'
import { requestClashProxies, requestSwitchProxy } from '../../apis'
import { gotErrorProxies, fetchProxies, gotProxyDelay, TProxyDelay } from '../actions/proxies-action'
import { callIPC } from '../../native-support/message-queue'
import { BRG_MSG_SWITCHED_PROXY, BRG_MSG_CHECK_DELAY } from '../../native-support/message-constants'
import { store } from '..'

export function *watchFetchProxies() {
    while (true) {
        yield take(ProxiesAction.fetchProxies)
        try {
            const result = yield call(requestClashProxies)
            if (result.proxies == null) {
                throw new Error('No proxies')
            }
            yield put(gotProxies(result.proxies))
        } catch (e) {
            yield put(gotErrorProxies(e))
        }
    }
}

export function *watchFetchSwitchProxy() {
    while (true) {
        const action = yield take(ProxiesAction.switchProxy)
        try {
            const result = yield call(requestSwitchProxy, action.selector, action.proxy)
            if (result == null) {
                yield call(callIPC, BRG_MSG_SWITCHED_PROXY, {
                    selector: action.selector,
                    proxy: action.proxy
                })
                yield put(fetchProxies())
            } else {
                throw result
            }
        } catch (e) {
            yield put(gotErrorProxies(e))
        }
    }
}

export function *watchCheckProxyDelay() {
    while (true) {
        yield take(ProxiesAction.checkProxyDelay)
        const selectors = store.getState().proxies.get('proxies', {})
        const currentSelector = store.getState().proxies.get('currentSelector')
        let proxies: string[] = []
        currentSelector.forEach((e) => {
            proxies = proxies.concat(selectors[e].all || [])
        })
        const group = proxies.length / 10 + 1
        for (let i = 0; i < group; i ++) {
            yield call(groupCheckDelay, proxies.slice(i * 10, (i + 1) * 10))
        }
        yield put({
            type: ProxiesAction.delayChecked
        })
    }
}

export function *watchCheckSelectorDelay() {
    while (true) {
        const action = yield take(ProxiesAction.checkDelayBySelector)
        const { selector } = action
        const selectors = store.getState().proxies.get('proxies', {})
        const proxies = selectors[selector].all || []
        const group = proxies.length / 10 + 1
        for (let i = 0; i < group; i ++) {
            yield call(groupCheckDelay, proxies.slice(i * 10, (i + 1) * 10))
        }
        yield put({
            type: ProxiesAction.delayChecked
        })
    }
}

function *groupCheckDelay(proxies: string[]) {
    try {
        const delaies: TProxyDelay[] = yield call(callIPC, BRG_MSG_CHECK_DELAY, {
            arg: proxies
        })
        const map: {[key: string]: number} = {}
        proxies.map((each, idx) => {
            map[each] = delaies[idx].delay || Number.MAX_SAFE_INTEGER
        })
        yield put(gotProxyDelay(map))
    } catch (e) {
        // TODO: Toast error
        yield put(gotProxyDelay({}))
    }
}
