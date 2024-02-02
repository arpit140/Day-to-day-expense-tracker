const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const bcrypt = require('bcrypt')
const Sequelize = require('sequelize')
const jwt = require('jsonwebtoken')
const Razorpay = require('razorpay')
const uuid = require('uuid')
// const sendinblue = require('sib-api-v3-sdk')
const nodemailer = require('nodemailer')
const app = express()
const port = 4000

app.use(cors())
app.use(bodyParser.json())
const transporter = nodemailer.createTransport({
    service: 'smtp-relay.sendinblue.com', 
    auth: {
        user: 'arpitsunn6@gmail.com',
        pass: 'xsmtpsib-e02f49227c481a99b273654b7e92ccfb7a421019a6aeebe6d558fae2fdf8ef47-Vz0gbJtakMTjLPSE',
    },
})


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

const Order = sequelize.define('order',{

    orderId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    status: {
        type: Sequelize.STRING,
        allowNull: false
    }
})
const ForgotPasswordRequest = sequelize.define('forgotPasswordRequest', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
    },
    isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
})

User.hasMany(Expense)
Expense.belongsTo(User)
User.hasMany(Order)
Order.belongsTo(User)
User.hasMany(ForgotPasswordRequest)
ForgotPasswordRequest.belongsTo(User)



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
        const userId = req.user.id
        const userExpenses = await Expense.findAll({
            where: { userId: userId }
        });

        res.status(200).json({ expenses: userExpenses })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Internal server error' })
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
        res.status(500).json({ error: 'Internal server error' })
    }
})

const razorpay = new Razorpay({
    key_id: "rzp_test_phG2IB5y8EJQCw",
    key_secret: "VYNrF0ac1uleN4TIwuNz04v6"
})

app.post('/create-razorpay-order', verifyToken , async (req,res) => {
    try{
        const {amount, currency} =req.body

        const orderOptions = {
            amount: amount,
            currency: currency,
            receipt: 'Premium_membership' + Date.now(),
            payment_capture: 1
        }
        const order = await razorpay.orders.create(orderOptions)
        const newOrder = await Order.create({
            orderId: order.id,
            status: 'CREATED',
            userId: req.user.id
        })
        res.status(200).json({orderId: order.id})
    }catch (error) {
        console.error('Error creating Razorpay order:', error)
        res.status(500).json({ error: 'Internal server error' })
    }

})
app.post('/razorpay-payment-success', async (req, res) => {
    try {
        const orderId = req.body.razorpay_order_id

        const order = await Order.findOne({ where: { orderId: orderId } })

        if (order) {
            
            await order.update({ status: 'SUCCESSFUL' })

            
            const user = await User.findByPk(req.user.id)
            await user.update({ isPremium: true })

            res.status(200).json({ message: 'Payment successful' })
        } else {
            console.error('Order not found in the database')
            res.status(404).json({ error: 'Order not found' })
        }
    } catch (error) {
        console.error('Error updating order status:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
});
app.get('/check-premium-membership', verifyToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        res.status(200).json({ isPremium: user.isPremium || false });
    } catch (error) {
        console.error('Error checking premium membership status:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
});

app.get('/leaderboard', verifyToken, async (req, res) => {
    try {
        const leaderboard = await User.findAll({
            attributes: ['name', [sequelize.fn('SUM', sequelize.col('expenses.amount')), 'totalExpenses']],
            include: [{
                model: Expense,
                attributes: [],
                where: { userId: sequelize.col('user.id') }
            }],
            group: ['user.id'],
            order: [[sequelize.fn('SUM', sequelize.col('expenses.amount')), 'DESC']]
        });

        res.status(200).json({ leaderboard })
    } catch (error) {
        console.error('Error fetching leaderboard:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
});
app.post('/password/forgotpassword', async (req, res) => {
    try {
        const userEmail = req.body.email

        const user = await User.findOne({ where: { email: userEmail } })

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

       
        const forgotPasswordRequest = await ForgotPasswordRequest.create({ userId: user.id })

    
        const mailOptions = {
            from: 'YOUR_EMAIL',
            to: userEmail,
            subject: 'Password Reset',
            text: `Here is your password reset link: YOUR_RESET_LINK/${forgotPasswordRequest.id}`,
        }

        res.status(200).json({ message: 'Password reset email sent successfully' })
    } catch (error) {
        console.error('Error sending reset password email:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

app.get('/fetch-daily-transactions', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const dailyTransactions = await fetchTransactions(userId, startDate, endDate);

        res.status(200).json({ transactions: dailyTransactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.get('/fetch-weekly-transactions', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - startDate.getDay()); 
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); 
        endDate.setHours(23, 59, 59, 999);

        const weeklyTransactions = await fetchTransactions(userId, startDate, endDate);

        res.status(200).json({ transactions: weeklyTransactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.get('/fetch-monthly-transactions', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const startDate = new Date();
        startDate.setDate(1); 
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1, 0); 
        endDate.setHours(23, 59, 59, 999);

        const monthlyTransactions = await fetchTransactions(userId, startDate, endDate);

        res.status(200).json({ transactions: monthlyTransactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


async function fetchTransactions(userId, startDate, endDate) {
    const transactions = await Expense.findAll({
        where: {
            userId: userId,
            createdAt: {
                [Sequelize.Op.between]: [startDate, endDate],
            },
        },
    });
    return transactions;
}

app.listen(port,(err) => {
    if(err) {console.log("Error starting the server"),err}
    console.log("Server is running on port:",port)
})