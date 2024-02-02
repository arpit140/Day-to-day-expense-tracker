document.addEventListener('DOMContentLoaded', async function () {
    await fetchAndDisplayExpenses()
    await checkPremiumMembershipStatus()
    await fetchAndDisplayLeaderboard();
})

async function fetchAndDisplayExpenses() {
    try{
       
        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:4000/fetch-expenses',{
            headers: {
                Authorization: token
            }
        })
        // console.log('Fetch Expenses Response:', response);

        const expenseContainer = document.getElementById('expenseContainer')
        expenseContainer.innerHTML = ''

        const expenses = response.data.expenses
        

        if(!expenses || expenses.length === 0){
            expenseContainer.innerHTML = `<p>No expense available.</p>`

        }else{
            expenses.forEach(expense => {
                const expenseElement = document.createElement('div')
                expenseElement.classList.add('expense-item')

                expenseElement.innerHTML = `
                    <p><strong>Amount:</strong> ${expense.amount}</p>
                    <p><strong>Description:</strong> ${expense.description}</p>
                    <p><strong>Category:</strong> ${expense.category}</p>
                    <button onclick="deleteExpense('${expense.id}')">Delete</button>
                    <hr>
                `;

                expenseContainer.appendChild(expenseElement)
            })
        }
    }catch (error) {
        console.error("Error fetching expenses:", error);
        alert("An error occurred while fetching expenses. Check the console for details.");
    }
}

async function submitExpense(event) {
    event.preventDefault()

    const amount = document.getElementById('amount').value
    const description = document.getElementById('description').value
    const category = document.getElementById('category').value
    // console.log(amount)

    try {

        const token = localStorage.getItem('token')
        const response = await axios.post('http://localhost:4000/submit-expense', {
            amount: amount,
            description: description,
            category: category
        },{
            headers: {
                Authorization: token
            }
        });


        alert(response.data.message)
        document.getElementById('amount').value = '';
        document.getElementById('description').value = '';
        document.getElementById('category').value = '';

        await fetchAndDisplayExpenses()
                

    }  catch (error) {
        console.error("Error submitting expense:", error);
        alert("An error occurred while submitting the expense. Check the console for details.");
        
    }
}

async function deleteExpense(expenseId){
    try{
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:4000/delete-expense/${expenseId}`,{
            headers: {
                Authorization: token
            }
         
        })
        alert('Expense deleted successfully')
        await fetchAndDisplayExpenses()
    }catch (error) {
        console.error('Error deleting expense:', error)
        alert('An error occurred while deleting the expense. Check the console for details.')
    }
}

async function buyPremiumMembership(){
    try{
        const token = localStorage.getItem('token')
        const response = await axios.post('http://localhost:4000/create-razorpay-order',{
            amount: 100,
            currency: 'INR',

        },{
            headers:{
                Authorization: token,
            }
        })
        const orderId = response.data.orderId

        const options = {
            key: 'rzp_test_phG2IB5y8EJQCw',
            amount: 1,
            currency: 'INR',
            order_id: orderId,
            name:'Arpit',
            description: 'Premium Membership',
            handler: function (response) {
                console.log("Razorpay Response:", response);
            
                // Check for the existence of razorpay_payment_id to determine payment success
                if (response?.razorpay_payment_id) {
                    document.getElementById('buyPremiumBtn').style.display = 'none';
                    document.getElementById('premiumMessage').style.display = 'block';
                } else {
                    console.error("Payment failed or status undefined:", response);
                }
            }

        }
        const rzp = new Razorpay(options)
        rzp.open()
    }catch (error) {
        console.error('Error creating Razorpay order:', error);
        alert('An error occurred while processing the payment. Please try again.');
    }
}
async function checkPremiumMembershipStatus() {
    try {
        const token = localStorage.getItem('token');
        console.log('Token:', token);

        const response = await axios.get('http://localhost:4000/check-premium-membership', {
            headers: {
                Authorization: token,
            },
        });

        console.log('Premium Membership Check Response:', response.data);

        const isPremium = response.data.isPremium;

        if (isPremium) {
            console.log('User is premium. Hiding button.');
            document.getElementById('buyPremiumBtn').style.display = 'none';
            document.getElementById('premiumMessage').style.display = 'block';
        } else {
            console.log('User is not premium. Showing button.');
            document.getElementById('buyPremiumBtn').style.display = 'block';
            document.getElementById('premiumMessage').style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking premium membership status:', error);
    }
}
async function fetchAndDisplayLeaderboard() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:4000/leaderboard', {
            headers: {
                Authorization: token
            }
        });

        const leaderboardContainer = document.getElementById('leaderboardContainer');
        leaderboardContainer.innerHTML = '';

        const leaderboard = response.data.leaderboard;

        if (!leaderboard || leaderboard.length === 0) {
            leaderboardContainer.innerHTML = `<p>No leaderboard available.</p>`;
        } else {
            leaderboard.forEach((user, index) => {
                const leaderboardElement = document.createElement('div');
                leaderboardElement.classList.add('leaderboard-item');

                leaderboardElement.innerHTML = `
                    <p>${index + 1}. <strong>Name:</strong> ${user.name}, <strong>Total expenses:</strong> ${user.totalExpenses}</p>
                `;

                leaderboardContainer.appendChild(leaderboardElement);
            });
        }
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        alert('An error occurred while fetching the leaderboard. Check the console for details.');
    }
}


async function fetchTransactionsByInterval(interval) {
    try {
        const response = await axios.get(`/fetch-${interval.toLowerCase()}-transactions`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        });
        const transactions = response.data.transactions;
        
        displayTransactions(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}


fetchTransactionsByInterval('Daily');


function displayTransactions(transactions) {
   
    console.log('Displaying transactions:', transactions);
}

