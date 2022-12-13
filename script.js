"use strict"

const mainContainer = document.getElementById('main-container');
const cardsContainer = document.getElementById('cards-container');
const sidebar = document.getElementById('sidebar');
const sidebarButton = document.getElementById('sidebar-button');
const sidebarClose = document.getElementById('sidebar-close');
const addCardText = document.getElementById('add-card-text');
const addCardButton = document.getElementById('add-card-button');
const boardsList = document.getElementById('boards-list');
const addBoardText = document.getElementById('add-board-text');
const addBoardButton = document.getElementById('add-board-button');
const autoSaveButton = document.getElementById('auto-save');
const cardContextMenu = document.getElementById('card-context-menu');
const cardContextMenuDelete = document.getElementById('card-context-menu-delete');

const aaatitle = document.getElementById('title');

// функция автосохраниения
let autoSaveInternalId = setInterval(function (){
    saveData();
}, 1000);

var appData = { // данные для localStorage
    'boards': [],
    'settings': {
        'userName': "User",
        'dataPersistence': true
    },
    'currentBoard': 0, 
    'identifier': 0
};
function currentCards() { // обработка текущей карточки
    return appData.boards[appData.currentBoard].cards;
}
function currentBoard() { // обработка досок 
    return appData.boards[appData.currentBoard];
}
//работа с массивами
Array.prototype.move = function(from, to) {

    this.splice(to, 0, this.splice(from, 1)[0]);
};
Array.prototype.insert = function(index, item) {
    this.splice( index, 0, item );
};
function uID() {
    appData.identifier += 1;
    return 'b' + appData.identifier;
}//создание уникального ID
function getMouseOverCard() {
    return document.querySelectorAll('.parent-card:hover')[0];
}// драг н дроп 
function getMouseOverItem() {
    return document.querySelectorAll('.parent-card > ul > li:hover')[0];
}// драг н дроп 

function getItemFromElement(element) { // получение элемента item
    for (let crd of currentCards()) {
        for (let item of crd.items) {
            if (item.id === element.id) {
                return item;
            }
        }
    }
}
function getCardFromElement(element) { // получение карточки от элемента
    return currentCards().find(e => e.id === element.id);
}

function getBoardFromId(id) { // получение доски от ID
    return appData.boards.find(b => b.id === id);
}

function listBoards() {
    boardsList.innerHTML = '';
    for (let board of appData.boards) {
        let boardTitle = document.createElement('li');
        boardTitle.innerText = board.name;
        boardTitle.id = board.id;
        if (board.id === currentBoard().id) boardTitle.classList.add('is-active');
        boardTitle.addEventListener('click', () => {
            renderBoard(board);
            listBoards();
        });
        boardsList.appendChild(boardTitle);
    }
}
function renderBoard(board) {
    appData.currentBoard = appData.boards.indexOf(board);
    aaatitle.innerText = currentBoard().name;
    renderAllCards();
}
function renderAllCards() {
    for (let card of cardsContainer.querySelectorAll('.parent-card')) {
        card.remove();
    }
    for (let card of currentCards()) {
        let generated = card.generateElement();
        cardsContainer.insertBefore(generated, cardsContainer.childNodes[cardsContainer.childNodes.length - 2]);
        card.update();
    }
}
function renderCard(cID) {
    let card = currentCards().find(e => e.id === cID);
    if (!card) {
        let currentCardElement = document.getElementById(cID);
        currentCardElement.parentNode.removeChild(currentCardElement);
        return;
    }
    let currentCardElement = document.getElementById(card.id);
    if (currentCardElement != null) {
        let generated = card.generateElement();
        currentCardElement.parentNode.replaceChild(generated, currentCardElement);
    } else {
        let generated = card.generateElement();
        cardsContainer.insertBefore(generated, cardsContainer.childNodes[cardsContainer.childNodes.length - 2]);
    }
    card.update();
}
function toggleHoverStyle(show) {
    if (show) {
        let hoverStyle = document.createElement('style');
        hoverStyle.id = "dragHover";
        document.body.appendChild(hoverStyle);
    } else {
        let hoverStyle = document.getElementById('dragHover');
        hoverStyle.parentNode.removeChild(hoverStyle);
    }
}
function addBoard() {
    let boardTitle = addBoardText.value;
    if (!boardTitle) return createAlert("Введите название доски"); 
    addBoardText.value = '';
    let newBoard = new Board(boardTitle, uID(), {'theme': null});
    appData.boards.push(newBoard);
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
        let element = document.getElementById(this.id);
        element.getElementsByTagName('p')[0].addEventListener('click', () => {
            if (this.isDone) {
                this.check(false);
            } else {
                this.check(true);
            }
        });

        element.addEventListener('mousedown', cardDrag_startDragging, false);
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
        for (let item of this.items) {
            item.update();
        }
    }
    renderItems() { // рендер карточки
        let newItemList = document.createElement('ul');
        newItemList.id = this.id + '-ul';
        for (let item of this.items) {
            let newItem = document.createElement('li');
            newItem.id = item.id;
            let newItemTitle = document.createElement('p');
            newItemTitle.innerText = item.title;
            newItemTitle.classList.add('item-title', 'text-fix', 'unselectable');
            let newItemButtons = document.createElement('span');
            let newItemEditButton = document.createElement('i');
            newItemEditButton.ariaHidden = true;
            newItemEditButton.classList.add('fa', 'fa-pencil');
            newItemEditButton.addEventListener('click', () => {
                let input = document.createElement('textarea');
                input.value = newItemTitle.textContent;
                input.classList.add('item-title');
                input.maxLength = 256;
                newItemTitle.replaceWith(input);
                let save = () => {
                    item.title = input.value;
                    renderCard(this.id);
                };
                input.addEventListener('blur', save, {
                    once: true,
                });
                input.focus();
            });
            let newItemDeleteButton = document.createElement('i');
            newItemDeleteButton.ariaHidden = true;
            newItemDeleteButton.classList.add('fa', 'fa-trash');
            newItemDeleteButton.addEventListener('click', () => {
                this.removeItem(item);
            });
            newItemButtons.appendChild(newItemEditButton);
            newItemButtons.appendChild(newItemDeleteButton);
            newItem.appendChild(newItemTitle);
            newItem.appendChild(newItemButtons);
            newItemList.appendChild(newItem);
        }
        return newItemList;
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
            let save = () => {
                this.name = input.value;
                renderCard(this.id);
            };
            input.addEventListener('blur', save, {
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
        newButton.innerText = 'Добавить';
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
        let cardTitle = addCardText.value; //название карточки
        addCardText.value = '';
            if (!cardTitle) cardTitle = `Доска без названия ${this.cards.length + 1}`; //если не назвать карточку
        let card = new Card(cardTitle, this.uID(), this.id);
        this.cards.push(card);

        let newCard = card.generateElement();
        cardsContainer.insertBefore(newCard, cardsContainer.childNodes[cardsContainer.childNodes.length - 2]);
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
        let hvrItem = getMouseOverItem();
        let hvCradObject = getCardFromElement(hvCrad);
        let hItemObj = getItemFromElement(cardDrag_mouseDownOn);
        if (hvCrad === hItemObj.getParentCard()) {
            if (hvrItem) {
                if (hvrItem !== cardDrag_mouseDownOn) {
                    let _hvrItemObject = getItemFromElement(hvrItem);
                    hvCradObject.items.move(hvCradObject.items.indexOf(hItemObj), hvCradObject.items.indexOf(_hvrItemObject));
                }
            }
            renderCard(hItemObj.getParentCard().id);
        } else {
            if (hvrItem) {
                if (hvrItem !== cardDrag_mouseDownOn) {
                    let hoverItemObject = getItemFromElement(hvrItem);
                    let hoverItemParentObject = getCardFromElement(hoverItemObject.getParentCard());
                    hoverItemParentObject.items.insert(hoverItemParentObject.items.indexOf(hoverItemObject), hItemObj);
                    getCardFromElement(hItemObj.getParentCard()).removeItem(hItemObj);
                    hItemObj.parentCardId = hoverItemParentObject.id;
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
mainContainer.addEventListener('mousemove', cardDrag_update);
mainContainer.addEventListener('mouseleave', cardDrag_stopDragging, false);
window.addEventListener('mouseup', cardDrag_stopDragging, false);
let scroll_mouseDown = false;
let scroll_startX, scroll_scrollLeft;

const scroll_startDragging = (e) => {
    scroll_mouseDown = true;
    scroll_startX = e.pageX - mainContainer.offsetLeft;
    scroll_scrollLeft = mainContainer.scrollLeft;
};
const scroll_stopDragging = (e) => {
    scroll_mouseDown = false;
};
const scroll_update = (e) => {
    e.preventDefault();
    if(!scroll_mouseDown || cardDrag_mouseDown) return;

    let scroll = (e.pageX - mainContainer.offsetLeft) - scroll_startX;
    mainContainer.scrollLeft = scroll_scrollLeft - scroll;
};
mainContainer.addEventListener('mousemove', scroll_update);
mainContainer.addEventListener('mousedown', scroll_startDragging, false);
mainContainer.addEventListener('mouseup', scroll_stopDragging, false);
mainContainer.addEventListener('mouseleave', scroll_stopDragging, false);
// ф-ии карточек 
let cardContextMenu_currentCard;
const cardContextMenu_show = (e) => {

    cardContextMenu_currentCard = getMouseOverCard();

    const { clientX: mouseX, clientY: mouseY } = e;
    cardContextMenu.style.top = mouseY + 'px';
    cardContextMenu.style.left = mouseX + 'px';
    cardContextMenu.classList.remove('visible');
    setTimeout(() => {
        cardContextMenu.classList.add('visible');
    });
};
const cardContextMenu_hide = (e) => {
    if (e.target.offsetParent != cardContextMenu && cardContextMenu.classList.contains('visible')) {
        cardContextMenu.classList.remove("visible");
    }
};
const cardContextMenu_deleteCard = () => {
        let curCardObject = getCardFromElement(cardContextMenu_currentCard);
        currentCards().splice(currentCards().indexOf(curCardObject), 1);
        cardContextMenu_hide({target:{offsetParent:'n/a'}}); 
        renderCard(curCardObject.id);
}
document.body.addEventListener('click', cardContextMenu_hide);
cardContextMenuDelete.addEventListener('click', cardContextMenu_deleteCard);
function saveData() { //сохраниение данных в LocalStorage
    window.localStorage.setItem('kards-appData', JSON.stringify(appData)); // 
}
function loadData() { //загрузка данных с localStorage
    let data = window.localStorage.getItem('kards-appData');
    if (data) {
        let appData = JSON.parse(data);
        appData.settings = appData.settings;
        appData.currentBoard = appData.currentBoard;
        appData.identifier = appData.identifier;
        for (let board of appData.boards) {
            let newBoard = new Board(board.name, board.id, board.settings, board.identifier);
            for (let card of board.cards) {
                let newCard = new Card(card.name, card.id, board.id);

                for (let item of card.items) {
                    let newItem = new Item(item.title, item.description, item.id, card.id);
                    newCard.items.push(newItem);
                }
                newBoard.cards.push(newCard);
            }
            appData.boards.push(newBoard);
        }

        renderBoard(appData.boards[appData.currentBoard]);
    } else {
        let defaultBoard = new Board("Untitled Board", 'b0', {'theme': null});
        appData.boards.push(defaultBoard);
    }
    listBoards();
}
function clearData() {
    window.localStorage.clear();
}
loadData();
addCardText.addEventListener('keyup', (e) => {
    if (e.code === "Enter") currentBoard().addCard();
});
addCardButton.addEventListener('click', () => currentBoard().addCard());

addBoardText.addEventListener('keyup', (e) => {
    if (e.code === "Enter") addBoard();
});
addBoardButton.addEventListener('click', addBoard);
autoSaveButton.addEventListener('change',  function (event) {
    if (this.checked) {
        autoSaveInternalId = setInterval(function (){
            saveData();
        }, 1000);
    } else {
        window.clearInterval(autoSaveInternalId);
    }
})

sidebarButton.addEventListener('click', toggleSidebar); // отвечает за открытие боковой панели
sidebarClose.addEventListener('click', toggleSidebar); // отвечает за закрытие боковой панели
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