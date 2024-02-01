const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const bcrypt = require('bcrypt')
const Sequelize = require('sequelize')
const jwt = require('jsonwebtoken')
const app = express()
const port = 4000

app.use(cors())
app.use(bodyParser.json())


const sequelize = new Sequelize ('expense-app', 'root', '7488552785aA@', {
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

const Expense = sequelize.define('expense', {
    amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING,
        allowNull: false,   
    },
    category: {
        type: Sequelize.STRING,
        allowNull: false,
    }
})


User.hasMany(Expense)
Expense.belongsTo(User)

User.prototype.validPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

sequelize.sync().then(() => {
    console.log('Database and table synced')
})

function verifyToken(req,res,next) {
    const token = req.header('Authorization')
    
    if(!token){
        return res.status(401).json({error: 'Unauthorized - Missing token'})
    }
    jwt.verify(token, '7488552785' , (err,decoded) => {
        if(err){
            return res.status(401).json({error: 'Unauthorized - Invalid token'})
        }

        req.user = { id: decoded.userId}
        next()
    })
}
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
        const token = jwt.sign({userId:user.id},'7488552785',{expiresIn: '1h'})

        res.status(200).json({message: "Login successfull",token})

    }catch(error) {
        console.error(error)
        res.status(500).json({error: "Internal server error"})
    }
})
app.post('/submit-expense',verifyToken, async(req,res) => {
    try{
        const{amount, description, category} = req.body

        const userId = req.user.id

        const newExpense = await Expense.create({
            amount: amount,
            description: description,
            category: category,
            userId: userId
        })
        const userExpense = await Expense.findAll({
            where: {userId: userId}
        })
        res.status(201).json({message: 'Expense added successfully', expense: newExpense})

    }catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Internal server error' })
    }
})
app.get('/fetch-expenses', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userExpenses = await Expense.findAll({
            where: { userId: userId }
        });

        res.status(200).json({ expenses: userExpenses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.delete('/delete-expense/:id', verifyToken, async (req,res) => {
    try{
        const expenseId = req.params.id
        const userId = req.user.id

        const expense = await Expense.findOne({
            where: {id: expenseId, userId:userId}
        })

        if(!expenseId){
            return res.status(404).json({ error: 'Expense not found' })
        }
        await expense.destroy()
        res.status(200).json({ message: 'Expense deleted successfully' })

    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
})
app.listen(port,(err) => {
    if(err) {console.log("Error starting the server"),err}
    console.log("Server is running on port:",port)
})