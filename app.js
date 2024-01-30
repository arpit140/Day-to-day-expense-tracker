const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const Sequelize = require('sequelize')
const app = express()
const port = 4000

app.use(cors())
app.use(bodyParser.json())


const sequelize = new Sequelize ('expense', 'root', '7488552785aA@', {
    host:'localhost',
    dialect: 'mysql'
})

const User = sequelize.define('user', {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    }
})

sequelize.sync().then(() => {
    console.log('Database and table synced')
})

app.post('/signup', async (req,res) => {
    try{
        const {name,email,password} = req.body

        const existingUser = await User.findOne({
            where: {
                email: email,
            },
        })
        if(existingUser) {
            return res.status(400).json({error: 'User already exists'})
        }
        const newUser = await User.create({
            name: name,
            email: email,
            password: password,
        })
        res.status(201).json({message: 'User registered successfully'})

    }catch (err) {
        console.error(err)
        res.status(500).json({error: 'internal server error'})
    }
})

app.listen(port,(err) => {
    if(err) {console.log("Error starting the server"),err}
    console.log("Server is running on port:",port)
})