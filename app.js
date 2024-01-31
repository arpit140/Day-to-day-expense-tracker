const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const bcrypt = require('bcrypt')
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

User.prototype.validPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

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

        const hashedPassword = await bcrypt.hash(password, 10)
        console.log('Hashed Password:', hashedPassword);
        const newUser = await User.create({
            name: name,
            email: email,
            password: hashedPassword,
        })
        res.status(201).json({message: 'User registered successfully'})

    }catch (err) {
        console.error(err)
        res.status(500).json({error: 'internal server error'})
    }
})

app.post('/login', async(req,res) => {
    try{
        const {email, password} =req.body
        console.log('Entered email =', email)
        const user = await User.findOne({
            where: {
                email: email.toLowerCase(),
            }
        })
        console.log('User Found=',user)

        if(!user || !(await user.validPassword(password))){
            return res.status(401).json({error: "Invalid email or password"})

        }

        res.status(200).json({message: "Login successfull"})

    }catch(error) {
        console.error(error)
        res.status(500).json({error: "Internal server error"})
    }
})

app.listen(port,(err) => {
    if(err) {console.log("Error starting the server"),err}
    console.log("Server is running on port:",port)
})