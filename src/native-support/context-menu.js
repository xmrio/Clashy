const contextMenu = require('electron-context-menu')

// const { actionVisible, parseAction } = require('./actions')
// const { ADD_SLIDE, DELETE_SLIDE } = require('../message-constants')

let window

contextMenu({
    menu: (actions, props, browserWindow, dictionarySuggestions) => [
        ...dictionarySuggestions,
        actions.separator(),
        actions.cut(),
        actions.copy(),
        actions.paste()
    ],
	// append: (defaultActions, params, browserWindow) => [
	// 	{
    //         label: 'Insert new slide',
    //         visible: actionVisible(params.linkURL),
    //         click: () => {
    //             const action = parseAction(params.linkURL)
    //             if (window) {
    //                 window.webContents.send(ADD_SLIDE, {
    //                     id: action.id
    //                 })
    //             }
    //         }
    //     },
    //     {
    //         label: 'Delete',
    //         visible: actionVisible(params.linkURL),
    //         click: () => {
    //             const action = parseAction(params.linkURL)
    //             if (window) {
    //                 window.webContents.send(DELETE_SLIDE, {
    //                     id: action.id
    //                 })
    //             }
    //         }
	// 	}
    // ]
});

const injectContextMenu = win => window = win 
const destroyContextMenu = () => window = null

module.exports = {
    injectContextMenu,
    destroyContextMenu
}