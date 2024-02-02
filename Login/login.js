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

function forgotPassword(){
    const formContainer = document.createElement('div')

    formContainer.innerHTML= `
    <form id="forgotPasswordForm">
        <label for="email">Enter your email:</label>
        <input type="email" id="email" name="email" required>
        <button type="button" onclick="submitForgotPasswordForm()">Submit</button>
    </form>
`
    document.body.appendChild(formContainer)
}

function submitForgotPasswordForm() {
    const userEmail = document.getElementById('email').value
    if(userEmail){
        axios.post('http://your-backend-url/password/forgotpassword',{email:userEmail})
            .then(response => {
                alert(response.data.message)

                const formContainer = document.getElementById('forgotPasswordForm')
                formContainer.parentNode.removeChild(formContainer)
            })
            .catch(error => {
                console.error('Error submitting forgot password form:', error)
                alert('An error occurred. Please try again.')
            })

    } else {
        alert("please enter a valid eamil.")
    }
       
}