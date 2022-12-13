function createAlert(text) {
    let e = document.createElement('div');
    let p = document.createElement('p');
    p.innerText = text;
    e.classList.add('alert');
    e.appendChild(p);

    e_alerts.appendChild(e);
    setTimeout(function(){
        e.classList.add('animate-hidden');
    }, 5000);
    setTimeout(function(){
        e.parentNode.removeChild(e);
    }, 5000);
}

function listenClickOutside(event) {
    const _withinBoundaries = event.composedPath().includes(e_sidebar);
    if (!_withinBoundaries && e_sidebar.style.width === "250px") {
        toggleSidebar();
    }
}
// уведомление

function testAlert(){
    return createAlert("Sample Text")
}