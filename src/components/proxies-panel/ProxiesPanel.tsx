import React, { useEffect, useState, useMemo, MouseEventHandler } from 'react'
import { connect } from 'react-redux'
import { Map } from 'immutable'
import { Card, CardContent, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, Fab, Checkbox, Snackbar, Button } from '@material-ui/core'

import './ProxiesPanel.css'
import { fetchProxies, switchProxy, checkProxiesDelay, checkDelayBySelector } from '../../store/actions'
import { Proxies } from '../../apis'
import { RootState } from '../../store/reducers'
import { TDispatch } from '../../utils'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { NetworkCheck, ArrowForward, OfflineBoltOutlined, SortOutlined, Check } from '@material-ui/icons'

interface Props {
    proxies: Proxies
    testingSpeed: boolean
    fetchProxies: () => void
    checkProxiesDelay: () => void
    switchProxy: (selector: string, proxy: string) => void
}

const _ProxiesPanel = ({ proxies, fetchProxies, switchProxy, checkProxiesDelay, testingSpeed }: Props) => {
    useEffect(() => {
        fetchProxies()
    }, [])
    const [showWait, setShowWait] = useState(false)
    const selectors = Object.keys(proxies)
    if (proxies == null || selectors.length === 0) {
        return <div> loading </div>
    }

    const checkDelay = () => {
        if (testingSpeed) {
            setShowWait(true)
            setTimeout(() => {
                setShowWait(false)
            }, 2000)
            return
        }
        checkProxiesDelay()
    }

    return (
        <div className={'ProxiesPanel'}>
            <div style={{ position: 'fixed', background: '#3F51B5', height: '180px',width: '100%', top: 0, left: 0, zIndex: 0 }} />
            {selectors.map((each, idx) => {
                const selector = proxies[each]
                return <ProxyCards
                            name={each}
                            proxies={selector.all || []}
                            key={idx}
                            selected={selector.now || ''}
                            onClickProxy={switchProxy}
                            />
            })}
            <Snackbar
                open={showWait}
                onClose={() => null}
                message={<span>Please wait.</span>}
            />
            <Fab
                color='secondary'
                style={{
                    position: 'fixed',
                    right: '0px',
                    bottom: '0px',
                    marginBottom: '48px',
                    marginRight: '32px'
                }}
                onClick={checkDelay}
            >
                <NetworkCheck />
            </Fab>
        </div>
    )
}

interface CardsProps {
    name: string,
    proxies: string[],
    selected: string,
    onClickProxy: (selector: string, proxy: string) => void,
    delay?: Map<string, number>
    testingSpeed?: boolean
    checkSelectorDelay?: (selector: string) => void
}

const EMPTY_DELAY = {}

const _ProxyCards = ({ name, proxies, selected, onClickProxy, delay, checkSelectorDelay, testingSpeed }: CardsProps) => {
    const rowCount = proxies.length / 3 || 1

    const [sort, setSort] = useState(false);
    const onClickSort: MouseEventHandler = useMemo(() => (e) => {
        e.stopPropagation()
        setSort(!sort)
    }, [sort])

    const onClickCheckSelector: MouseEventHandler = useMemo(() => (e) => {
        e.stopPropagation()
        if (testingSpeed) {
            return
        }
        checkSelectorDelay && checkSelectorDelay(name)
    }, [name, checkSelectorDelay, testingSpeed])

    const rows = useMemo(() => {
        let proxyArray = proxies;
        if (sort && delay) {
            proxyArray = [...proxies].sort((a, b) => {
                const left = delay.get(a) || 0
                const right = delay.get(b) || 0
                return left - right
            })
        }
        const ret = [];
        for (let i = 0; i < rowCount; i ++) {
            ret.push(proxyArray.slice(3 * i, 3 * (i + 1)))
        }
        return ret
    }, [proxies, sort, delay])

    return (
        <ExpansionPanel className='ProxyCards' TransitionProps={{ unmountOnExit: true }} square={true} >
            <ExpansionPanelSummary
                expandIcon={<ExpandMoreIcon />}
            >
                <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', margin: '5px', height: '30px' }}>
                    <p style={{ fontSize: '20px', margin: '0 0', padding: '0 0', lineHeight: '20px' }}>{name} </p>
                    {selected ?
                        [<ArrowForward key='header-icon' style={{ fontSize: '20px', height: '18px' }} color='secondary' />, <p key='header-selected'> {selected}</p>]
                        : null}
                </div>
                <Button style={{ alignSelf: 'flex-end' }} onClick={onClickCheckSelector}>
                    <OfflineBoltOutlined color="primary" />
                </Button>
                <Button style={{ alignSelf: 'flex-end' }} onClick={onClickSort}>
                    <SortOutlined color="primary" />
                    { sort ? <Check color="secondary" style={{ position: 'absolute', width: 20, height: 20, bottom: 0, right: 0 }} /> : null }
                </Button>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <div style={{ width: '100%', flex: 1, textAlign: 'center', overflowY: 'auto', marginTop: '10px' }}>
                    {
                        rows.map((each, key) => {
                            return (
                                <div className='CardsRow' key={'' + key}>
                                    {
                                        each.map((every, idx) =>
                                            <ClickableCards proxy={every} selector={name} selected={selected} onClick={onClickProxy} key={'' + idx} />
                                        )
                                    }
                                </div>
                            )
                        })
                    }
                </div>
            </ExpansionPanelDetails>
        </ExpansionPanel>
    )
}

const ProxyCards = connect(
    (state: RootState, props: CardsProps) => ({
        delay: state.proxies.get('delaies') || EMPTY_DELAY,
        testingSpeed: state.proxies.get('testingSpeed')
    }),
    (dispatch: TDispatch) => ({
        checkSelectorDelay: (selector: string) => dispatch(checkDelayBySelector(selector))
    })
)(_ProxyCards)

interface ClickableProps {
    proxy: string,
    selected: string,
    selector: string,
    delay?: number
    onClick: (selector: string, proxy: string) => void
}

const _ClickableCards = ({ proxy, selected, selector, delay = -1, onClick }: ClickableProps) => {
    const onClickProxy = () => {
        onClick(selector, proxy)
    }
    const color = delay === Number.MAX_SAFE_INTEGER ? '#FD536F' : delay < 200 ? '#C3E88D' : '#C59E57'
    return (
        <Card
            square={true}
            className={'ProxyCard'}
            style={{ backgroundColor: proxy === selected ? '#E6F7FF' : 'white' }}
            onClick={onClickProxy}
        >
            <CardContent style={{ width: '100%', height: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0px 0px 0px 8px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <p className='ProxyName'>{proxy}</p>
                        <Checkbox
                            checked={proxy === selected}
                        />
                    </div>
                    <p style={{
                        color
                    }} className='ProxyDelay'>
                        {delay === -1 ? '' : delay === Number.MAX_SAFE_INTEGER ? 'Timeout' : `${delay}ms`}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

const ClickableCards = connect((state: RootState, props: ClickableProps) => ({
    delay: state.proxies.get('delaies').get(props.proxy, -1)
}), null)(_ClickableCards)

const mapStateToProps = (state: RootState) => {
    return {
        proxies: state.proxies.get('proxies'),
        testingSpeed: state.proxies.get('testingSpeed')
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        fetchProxies: () => dispatch(fetchProxies()),
        checkProxiesDelay: () => dispatch(checkProxiesDelay()),
        switchProxy: (selector: string, proxy: string) => dispatch(switchProxy(selector, proxy))
    }
}

export const ProxiesPanel = connect(mapStateToProps, mapDispatchToProps)(_ProxiesPanel)
