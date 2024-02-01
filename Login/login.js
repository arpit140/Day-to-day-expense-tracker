async function login(event) {
    event.preventDefault()
    const email = document.getElementById('email').value 
    const password = document.getElementById('password').value
    // console.log(email)

    try{
        const response = await axios.post('http://localhost:4000/login' , {
            email: email,
            password: password
        })
        localStorage.setItem('token', response.data.token)
        alert(response.data.message)

        if(response.status === 200){
            window.location.href = '../Expense/expense.html'
        }
    }catch(error) {
        alert(error.response.data.error)
    }
    
}