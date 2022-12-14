"use strict"

const e_mainContainer = document.getElementById('main-container');
const e_cardsContainer = document.getElementById('cards-container');
const e_sidebar = document.getElementById('sidebar');
const e_sidebarButton = document.getElementById('sidebar-button');
const e_sidebarClose = document.getElementById('sidebar-close');
const e_addCardText = document.getElementById('add-card-text');
const e_addCardButton = document.getElementById('add-card-button');
const e_boardsList = document.getElementById('boards-list');
const e_addBoardText = document.getElementById('add-board-text');
const e_addBoardButton = document.getElementById('add-board-button');
const e_autoSaveButton = document.getElementById('auto-save');
const e_saveButton = document.getElementById('save-button');
const e_settingsButton = document.getElementById('settings-button');
const e_deleteButton = document.getElementById('delete-button');
const e_cardContextMenu = document.getElementById('card-context-menu');
const e_cardContextMenuDelete = document.getElementById('card-context-menu-delete');

const e_alerts = document.getElementById('alerts');

const e_title = document.getElementById('title');

let autoSaveInternalId = setInterval(function (){
    saveData();
}, 1000);

var appData = {
    'boards': [],
    'settings': {
        'userName': "User",
        'dataPersistence': true
    },
    'currentBoard': 0, 
    'identifier': 0
};
function currentCards() {
    return appData.boards[appData.currentBoard].cards;
}
function currentBoard() {
    return appData.boards[appData.currentBoard];
}
Array.prototype.move = function(from, to) {

    this.splice(to, 0, this.splice(from, 1)[0]);
};
Array.prototype.insert = function(index, item) {
    this.splice( index, 0, item );
};
function uID() {
    appData.identifier += 1;
    return 'b' + appData.identifier;
}
function getMouseOverCard() {
    return document.querySelectorAll('.parent-card:hover')[0];
}
function getMouseOverItem() {
    return document.querySelectorAll('.parent-card > ul > li:hover')[0];
}

function getItemFromElement(element) {
    for (let _card of currentCards()) {
        for (let _item of _card.items) {
            if (_item.id === element.id) {
                return _item;
            }
        }
    }
}
function getCardFromElement(element) {
    return currentCards().find(e => e.id === element.id);
}

function getBoardFromId(id) {
    return appData.boards.find(_b => _b.id === id);
}

function listBoards() {
    e_boardsList.innerHTML = '';
    for (let _board of appData.boards) {
        let _boardTitle = document.createElement('li');
        _boardTitle.innerText = _board.name;
        _boardTitle.id = _board.id;
        if (_board.id === currentBoard().id) _boardTitle.classList.add('is-active');
        _boardTitle.addEventListener('click', () => {
            renderBoard(_board);
            listBoards();
        });
        e_boardsList.appendChild(_boardTitle);
    }
}
function renderBoard(board) {
    appData.currentBoard = appData.boards.indexOf(board);
    document.title = 'Cool-board | ' + currentBoard().name;
    e_title.innerText = currentBoard().name;
    renderAllCards();
}

function renderAllCards() {
    for (let card of e_cardsContainer.querySelectorAll('.parent-card')) {
        card.remove();
    }
    for (let card of currentCards()) {
        let generated = card.generateElement();
        e_cardsContainer.insertBefore(generated, e_cardsContainer.childNodes[e_cardsContainer.childNodes.length - 2]);
        card.update();
    }
}
function renderCard(cardID) {
    let _card = currentCards().find(e => e.id === cardID);

    if (!_card) {
        let _currentCardElement = document.getElementById(cardID);
        _currentCardElement.parentNode.removeChild(_currentCardElement);
        return;
    }
    let _currentCardElement = document.getElementById(_card.id);
    if (_currentCardElement != null) {
        let _generated = _card.generateElement();
        _currentCardElement.parentNode.replaceChild(_generated, _currentCardElement);
    } else {
        let _generated = _card.generateElement();
        e_cardsContainer.insertBefore(_generated, e_cardsContainer.childNodes[e_cardsContainer.childNodes.length - 2]);
    }
    _card.update();
}

function toggleHoverStyle(show) {

    if (show) {

        let _hoverStyle = document.createElement('style');
        _hoverStyle.id = "dragHover";
        document.body.appendChild(_hoverStyle);
    } else {

        let _hoverStyle = document.getElementById('dragHover');
        _hoverStyle.parentNode.removeChild(_hoverStyle);
    }
}

function addBoard() {
    let _boardTitle = e_addBoardText.value;
    if (!_boardTitle) return createAlert("Введите название доски"); 
    e_addBoardText.value = '';

    let _newBoard = new Board(_boardTitle, uID(), {'theme': null});
    appData.boards.push(_newBoard);
    listBoards();
}

class Item {

    constructor(title, description=null, id, parentCardId) {
        this.title = title;
        this.description = description; 
        this.id = id;
        this.isDone = false;
        this.parentCardId = parentCardId;
    }

    getParentCard() {
        return document.getElementById(this.parentCardId);
    }

    check(chk=true) {
        this.isDone = chk;
        if (chk) {
            document.getElementById(this.id).style.textDecoration = 'line-through';
        } else {
            document.getElementById(this.id).style.textDecoration = 'none';
        }
    }
    update() {
        let _element = document.getElementById(this.id);
        _element.getElementsByTagName('p')[0].addEventListener('click', () => {
            if (this.isDone) {
                this.check(false);
            } else {
                this.check(true);
            }
        });

        _element.addEventListener('mousedown', cardDrag_startDragging, false);
        this.check(this.isDone);
    }
}

class Card {

    constructor(name, id, parentBoardId) {
        this.name = name;
        this.items = [];
        this.id = id;
        this.parentBoardId = parentBoardId;
    }
    addItem(item) {
        this.items.push(item);
        renderCard(this.id);
    }
    removeItem(item) {
        this.items = this.items.filter(val => val !== item);
        renderCard(this.id);
    }
    update() {
        for (let _item of this.items) {
            _item.update();
        }
    }
    renderItems() {
        let _newItemList = document.createElement('ul');
        _newItemList.id = this.id + '-ul';
        for (let _item of this.items) {
            let _newItem = document.createElement('li');
            _newItem.id = _item.id;
            let _newItemTitle = document.createElement('p');
            _newItemTitle.innerText = _item.title;
            _newItemTitle.classList.add('item-title', 'text-fix', 'unselectable');
            let _newItemButtons = document.createElement('span');
            let _newItemEditButton = document.createElement('i');
            _newItemEditButton.ariaHidden = true;
            _newItemEditButton.classList.add('fa', 'fa-pencil');
            _newItemEditButton.addEventListener('click', () => {
                let _input = document.createElement('textarea');
                _input.value = _newItemTitle.textContent;
                _input.classList.add('item-title');
                _input.maxLength = 256;
                _newItemTitle.replaceWith(_input);
                let _save = () => {
                    _item.title = _input.value;
                    renderCard(this.id);
                };
                _input.addEventListener('blur', _save, {
                    once: true,
                });
                _input.focus();
            });
            let _newItemDeleteButton = document.createElement('i');
            _newItemDeleteButton.ariaHidden = true;
            _newItemDeleteButton.classList.add('fa', 'fa-trash');
            _newItemDeleteButton.addEventListener('click', () => {
                createConfirmDialog("Ты хочешь удалить задание?", () => this.removeItem(_item));
            });
            _newItemButtons.appendChild(_newItemEditButton);
            _newItemButtons.appendChild(_newItemDeleteButton);
            _newItem.appendChild(_newItemTitle);
            _newItem.appendChild(_newItemButtons);
            _newItemList.appendChild(_newItem);
        }
        return _newItemList;
    }
    generateElement() {

        let newCardHeader = document.createElement('span');
        let newCardHeaderTitle = document.createElement('h2');
        newCardHeaderTitle.id = this.id + '-h2';
        newCardHeaderTitle.innerText = this.name;
        newCardHeaderTitle.classList.add('text-fix', 'card-title');
        newCardHeaderTitle.addEventListener('click', (e) => {
            let input = document.createElement('input');
            input.value = newCardHeaderTitle.textContent;
            input.classList.add('card-title');
            input.maxLength = 128;
            newCardHeaderTitle.replaceWith(input);
            let _save = () => {
                this.name = input.value;
                renderCard(this.id);
            };
            input.addEventListener('blur', _save, {
                once: true,
            });
            input.focus();
        });
        let newCardHeaderMenu = document.createElement('i');
        newCardHeaderMenu.ariaHidden = true;
        newCardHeaderMenu.classList.add("fa", "fa-bars");
        newCardHeader.append(newCardHeaderTitle);
        newCardHeader.append(newCardHeaderMenu);
        newCardHeaderMenu.addEventListener('click', cardContextMenu_show);

        let newInput = document.createElement('input');
        newInput.id = this.id + '-input';
        newInput.maxLength = 256;
        newInput.type = 'text';
        newInput.name = "add-todo-text";
        newInput.placeholder = "Add Task...";
        newInput.addEventListener('keyup', (e) => {
            if (e.code === "Enter") newButton.click();
        });
        let newButton = document.createElement('button');
        newButton.id = this.id + '-button';
        newButton.classList.add("plus-button");
        newButton.innerText = '+';
        newButton.addEventListener('click', () => {
            let inputValue = newInput.value;
            if (!inputValue) return createAlert("Сначала назовите премет");
            let item = new Item(inputValue, null, getBoardFromId(this.parentBoardId).uID(), this.id);
            this.addItem(item);
            newInput.value = '';
            newInput.focus();
        });
        let newCard = document.createElement('div');
        newCard.id = this.id;
        newCard.classList.add('parent-card');
        newCard.appendChild(newCardHeader);

        if (this.items) {
            let newItemList = this.renderItems();
            newCard.appendChild(newItemList);
        }
        newCard.appendChild(newInput);
        newCard.appendChild(newButton);

        return newCard;
    }
}
class Board {
    constructor(name, id, settings, identifier=0) {
        this.name = name;
        this.id = id;
        this.settings = settings;
        this.cards = [];  
        this.identifier = identifier;  
    }

    uID() {
        this.identifier += 1;
        return 'e' + this.identifier.toString();
    }
    addCard() {
        let _cardTitle = e_addCardText.value; //название карточки
        e_addCardText.value = '';
            if (!_cardTitle) _cardTitle = `Доска без названия ${this.cards.length + 1}`; //если не назвать карточку
        let _card = new Card(_cardTitle, this.uID(), this.id);
        this.cards.push(_card);

        let _newCard = _card.generateElement();
        e_cardsContainer.insertBefore(_newCard, e_cardsContainer.childNodes[e_cardsContainer.childNodes.length - 2]);
    }
}

var cardDrag_mouseDown = false;  
var cardDrag_mouseDownOn = null;  

const cardDrag_update = (e) => {
    if (!cardDrag_mouseDown && !cardDrag_mouseDownOn) return;
    cardDrag_mouseDownOn.style.left = e.pageX + 'px';
    cardDrag_mouseDownOn.style.top = e.pageY + 'px';
};

const cardDrag_startDragging = (e) => {
    if (e.target.tagName !== 'LI') return;

    cardDrag_mouseDown = true;
    cardDrag_mouseDownOn = e.target;
    cardDrag_mouseDownOn.style.position = 'absolute';
    toggleHoverStyle(true);
};

const cardDrag_stopDragging = (e) => {
    if (!cardDrag_mouseDown) return;
    toggleHoverStyle(false);
    let hvCrad = getMouseOverCard();
    if (hvCrad) {
        let _hoverItem = getMouseOverItem();
        let hvCradObject = getCardFromElement(hvCrad);
        let hItemObj = getItemFromElement(cardDrag_mouseDownOn);
        if (hvCrad === hItemObj.getParentCard()) {
            if (_hoverItem) {
                if (_hoverItem !== cardDrag_mouseDownOn) {
                    let _hoverItemObject = getItemFromElement(_hoverItem);
                    hvCradObject.items.move(hvCradObject.items.indexOf(hItemObj), hvCradObject.items.indexOf(_hoverItemObject));
                }
            }

            renderCard(hItemObj.getParentCard().id);

        } else {

            if (_hoverItem) {
                if (_hoverItem !== cardDrag_mouseDownOn) {
                    let _hoverItemObject = getItemFromElement(_hoverItem);
                    let _hoverItemParentObject = getCardFromElement(_hoverItemObject.getParentCard());
                    _hoverItemParentObject.items.insert(_hoverItemParentObject.items.indexOf(_hoverItemObject), hItemObj);
                    getCardFromElement(hItemObj.getParentCard()).removeItem(hItemObj);
                    hItemObj.parentCardId = _hoverItemParentObject.id;
                }
            } else {
                hvCradObject.items.push(hItemObj);

                getCardFromElement(hItemObj.getParentCard()).removeItem(hItemObj);
                hItemObj.parentCardId = hvCradObject.id;
            }

            renderCard(hvCradObject.id);
            renderCard(hItemObj.getParentCard().id);
        }

    }
    cardDrag_mouseDown = false;
    cardDrag_mouseDownOn.style.position = 'static';
    cardDrag_mouseDownOn = null;
};

e_mainContainer.addEventListener('mousemove', cardDrag_update);
e_mainContainer.addEventListener('mouseleave', cardDrag_stopDragging, false);
window.addEventListener('mouseup', cardDrag_stopDragging, false);



let scroll_mouseDown = false;
let scroll_startX, scroll_scrollLeft;

const scroll_startDragging = (e) => {
    scroll_mouseDown = true;
    scroll_startX = e.pageX - e_mainContainer.offsetLeft;
    scroll_scrollLeft = e_mainContainer.scrollLeft;
};

const scroll_stopDragging = (e) => {
    scroll_mouseDown = false;
};

const scroll_update = (e) => {
    e.preventDefault();
    if(!scroll_mouseDown || cardDrag_mouseDown) return;

    let _scroll = (e.pageX - e_mainContainer.offsetLeft) - scroll_startX;
    e_mainContainer.scrollLeft = scroll_scrollLeft - _scroll;
};

e_mainContainer.addEventListener('mousemove', scroll_update);
e_mainContainer.addEventListener('mousedown', scroll_startDragging, false);
e_mainContainer.addEventListener('mouseup', scroll_stopDragging, false);
e_mainContainer.addEventListener('mouseleave', scroll_stopDragging, false);


// ф-ии карточек 
let cardContextMenu_currentCard;
const cardContextMenu_show = (e) => {

    cardContextMenu_currentCard = getMouseOverCard();

    const { clientX: mouseX, clientY: mouseY } = e;
    e_cardContextMenu.style.top = mouseY + 'px';
    e_cardContextMenu.style.left = mouseX + 'px';

    e_cardContextMenu.classList.remove('visible');
    setTimeout(() => {
        e_cardContextMenu.classList.add('visible');
    });

};

const cardContextMenu_hide = (e) => {
    if (e.target.offsetParent != e_cardContextMenu && e_cardContextMenu.classList.contains('visible')) {
        e_cardContextMenu.classList.remove("visible");
    }
};


const cardContextMenu_deleteCard = () => {
        let _currentCardObject = getCardFromElement(cardContextMenu_currentCard);
        currentCards().splice(currentCards().indexOf(_currentCardObject), 1);
        cardContextMenu_hide({target:{offsetParent:'n/a'}}); 
        renderCard(_currentCardObject.id);
}
document.body.addEventListener('click', cardContextMenu_hide);
e_cardContextMenuDelete.addEventListener('click', cardContextMenu_deleteCard);

function saveData() {
    window.localStorage.setItem('kards-appData', JSON.stringify(appData));
}

function getDataFromLocalStorage() {
    return window.localStorage.getItem('kards-appData');
}

function loadData() { //загрузка данных с localStorage
    let _data = window.localStorage.getItem('kards-appData');
    if (_data) {
        let _appData = JSON.parse(_data);
        appData.settings = _appData.settings;
        appData.currentBoard = _appData.currentBoard;
        appData.identifier = _appData.identifier;
        for (let _board of _appData.boards) {
            let _newBoard = new Board(_board.name, _board.id, _board.settings, _board.identifier);
            for (let _card of _board.cards) {
                let _newCard = new Card(_card.name, _card.id, _board.id);

                for (let _item of _card.items) {
                    let _newItem = new Item(_item.title, _item.description, _item.id, _card.id);
                    _newCard.items.push(_newItem);
                }
                _newBoard.cards.push(_newCard);
            }
            appData.boards.push(_newBoard);
        }

        renderBoard(appData.boards[appData.currentBoard]);
    } else {
        let _defaultBoard = new Board("Untitled Board", 'b0', {'theme': null});
        appData.boards.push(_defaultBoard);
    }
    listBoards();
}

function clearData() {
    window.localStorage.clear();
}

loadData();

e_addCardText.addEventListener('keyup', (e) => {
    if (e.code === "Enter") currentBoard().addCard();
});

e_addCardButton.addEventListener('click', () => currentBoard().addCard());

e_addBoardText.addEventListener('keyup', (e) => {
    if (e.code === "Enter") addBoard();
});

e_addBoardButton.addEventListener('click', addBoard);

e_autoSaveButton.addEventListener('change',  function (event) {
    if (this.checked) {
        autoSaveInternalId = setInterval(function (){
            saveData();
        }, 1000);
    } else {
        window.clearInterval(autoSaveInternalId);
    }
})
window.onbeforeunload = function () {
    if (JSON.stringify(appData) !== getDataFromLocalStorage()) {
        return confirm();
    }
}

function toggleSidebar() {
    if (('toggled' in e_sidebar.dataset)) {
        delete e_sidebar.dataset.toggled;
        e_sidebar.style.width = "0";
        e_sidebar.style.boxShadow = "unset";
        document.removeEventListener('click', listenClickOutside);
    } else {
        e_sidebar.dataset.toggled = '';
        e_sidebar.style.width = "250px";
        e_sidebar.style.boxShadow = "100px 100px 0 100vw rgb(0 0 0 / 50%)";
        setTimeout(() => {
            document.addEventListener('click', listenClickOutside);
        }, 300);
    }
}
e_sidebarButton.addEventListener('click', toggleSidebar);
e_sidebarClose.addEventListener('click', toggleSidebar);



//модалка
function createConfirmDialog(text, onConfirm) {
    cardContextMenu_hide({target:{offsetParent:'n/a'}});

    var modal = document.getElementById("dialog"); //само окно
    var span = document.getElementById("dialog-close");
    var dialogText = document.getElementById('dialog-text');
    var cancelButton = document.getElementById('dialog-cancel');
    var confirmButton = document.getElementById('dialog-confirm');
    modal.style.display = "block";
    dialogText.textContent = text;
    span.onclick = function() {
        modal.style.display = "none";
    }
    cancelButton.onclick = () => {
        modal.style.display = "none";
    }
    confirmButton.onclick = () => {
        modal.style.display = "none";
        onConfirm && onConfirm();
    }
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }
}