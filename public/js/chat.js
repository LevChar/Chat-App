const socket = io()
Mustache.tags = ["[[", "]]"];   //hbs uses {{}} so we need to set-up Mustache to use [[]]

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
//const messageTemplate = document.querySelector('#Message-template').innerHTML
const locationMessageTemplate = document.querySelector('#Location-message-template').innerHTML
const sideBarTemplate = document.querySelector('#Side-bar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new Msg
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight

    //Height of messagesContainer
    const containerHeight = $messages.scrollHeight

    //Distance of current scroll
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

// Listen for "message"
socket.on('message', (msgFromServer) => {
    //First way of manipulating the DOM - without using Mustache library
    const msgToDom = (createdAt, message, username) => {
        console.log(createdAt, message)

        return `<div class="message">
                    <p>
                    <span class="message__name"> ${username} </span>
                    <span class="message__meta"> ${createdAt} </span>     
                    </p> 
                    <p> ${message} </p> 
                </div>`
    }

    msg = msgFromServer.text
    createdAt = moment(msgFromServer.createdAt).format('HH:mm')
    uname = msgFromServer.username
    messages.insertAdjacentHTML('beforeend', msgToDom(createdAt, msg, uname));
    autoScroll()
})

// Listen for "locationMessage"
socket.on('locationMessage', (locationMsgFromServer) => {
    //Second way of manipulating the DOM - using Mustache library
    const html = Mustache.render(locationMessageTemplate, {
        username: locationMsgFromServer.username,
        url: locationMsgFromServer.url,
        createdAt: moment(locationMsgFromServer.createdAt).format('HH:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sideBarTemplate, {
        room,
        users
    })
    document.querySelector('#sideBar').innerHTML = html
})

//Listen on send button
$messageForm.addEventListener('submit', (e) => {
    //stop the browser from refreshing the page on submit
    e.preventDefault()
    //Disable Send button till the ack received
    $messageFormButton.setAttribute('disabled', 'disabled')
    //The same as: e.target.elements.message.value

    const msg = $messageFormInput.value
    socket.emit('sendMessage', msg, (ackMsgError) => {
        //Re-enable the Send button after ack received, clear the input 
        //form & set focus back on it
        $messageFormButton.removeAttribute('disabled', 'disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (ackMsgError) {
            return console.log(ackMsgError)
        }

        console.log('The msg was delivered!')
    })
})

$sendLocationButton.addEventListener('click', (e) => {
    e.preventDefault()         //stop the browser from refreshing the page on submit

    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser!')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled', 'disabled')
            console.log('The location was shared!')
        })
    })
})

socket.emit('Join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})