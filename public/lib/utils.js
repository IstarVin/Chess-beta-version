function parseCookie() {
    let parsed
    document.cookie
    .split(';')
    .map(v => v.split('='))
    .reduce((acc, v) => {
        acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
        parsed = acc;
    }, {})
    return parsed
}

function getRoomID() {
    const roomID = document.location.href.match(/\w\w\w-\w\w\w\w-\w\w\w/)
    return roomID ? roomID.at(0): null
}

function createElement(name, options = {}) {
    const element = document.createElement(name)
    for (const [attr, value] of Object.entries(options)) {
        if (attr === 'text') element.innerText = value
        else element.setAttribute(attr, value)
    }
    return element
}
