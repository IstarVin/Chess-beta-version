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
