export function isWindows() {
    return window.navigator.platform.includes('Win') 
}

export function isLinux() {
    return window.navigator.platform.includes('Linux')
}