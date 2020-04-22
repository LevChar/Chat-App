const users = []

//addUser
const addUser = ({ id, username, room }) => {
    //Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //validate the data was entered
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

    //validate the username is unique
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    if (existingUser) {
        return {
            error: 'Username is in use!'
        }
    }

    //Store the user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

//RemoveUser
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)
    if (index !== -1) {
        return users.splice(index, 1)[0]
    }
}

//getUser
const getUser = (id) => {
    const desiredUser = users.find((user) => user.id === id)

    if (!desiredUser) {
        return {
            error: 'No such User!'
        }
    }

    return desiredUser
}

//getUsersInRoom
const getUsersInRoom = (room) => {
    usersInRoom = users.filter((user) => user.room === room)
    if (!usersInRoom) {
        return {
            error: 'No users in the room!'
        }
    }
    return usersInRoom
}

module.exports = {
    addUser,
    getUser,
    removeUser,
    getUsersInRoom
}