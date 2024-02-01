document.addEventListener('DOMContentLoaded', async function () {
    await fetchAndDisplayExpenses()
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