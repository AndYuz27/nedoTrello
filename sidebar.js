function toggleSidebar() {
    if (('toggled' in sidebar.dataset)) {
        delete sidebar.dataset.toggled;
        sidebar.style.width = "0";
        sidebar.style.boxShadow = "unset";
        document.removeEventListener('click', listenClickOutside);
    } else {
        sidebar.dataset.toggled = '';
        sidebar.style.width = "250px";
        sidebar.style.boxShadow = "100px 100px 0 100vw rgb(0 0 0 / 50%)";
        setTimeout(() => {
            document.addEventListener('click', listenClickOutside);
        }, 300);
    }
}